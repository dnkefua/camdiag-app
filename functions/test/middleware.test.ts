import { beforeEach,afterEach,describe,it,expect,vi } from 'vitest';
import type { Request,Response } from 'express';
const fakes = vi.hoisted(() => ({verifyIdToken:vi.fn(),verifyAppCheck:vi.fn(),membership:vi.fn(),runTransaction:vi.fn(),add:vi.fn()}));
vi.mock('firebase-admin/auth',() => ({getAuth:() => ({verifyIdToken:fakes.verifyIdToken})}));
vi.mock('firebase-admin/app-check',() => ({getAppCheck:() => ({verifyToken:fakes.verifyAppCheck})}));
vi.mock('firebase-admin/firestore',() => ({getFirestore:() => ({collection:() => ({doc:() => ({get:fakes.membership}),add:fakes.add}),runTransaction:fakes.runTransaction}),Timestamp:{now:()=>({seconds:1}),fromDate:(value:Date)=>value}}));
vi.mock('../src/config.js',() => ({APP_CHECK_ENFORCED:{value:()=> 'false'},AUDIT_LOG_RETENTION_DAYS:{value:()=> '90'}}));
import { verifyAuth,verifyIdentity } from '../src/middleware/auth.js';
import { verifyAppCheck } from '../src/middleware/appCheck.js';
import { rateLimiter } from '../src/middleware/rateLimiter.js';
import { writeAuditLog } from '../src/services/audit.js';

const response = () => {const res = {status:vi.fn(),json:vi.fn(),setHeader:vi.fn()};res.status.mockReturnValue(res);return res as unknown as Response;};
const request = (extra={}) => ({headers:{authorization:'Bearer synthetic-token'},header:()=>undefined,uid:'u1',path:'/analyze',...extra} as unknown as Request);
const settle = async() => {await new Promise((resolve)=>setTimeout(resolve,0));};
beforeEach(() => {vi.clearAllMocks();fakes.verifyIdToken.mockResolvedValue({uid:'u1',auth_time:100,verifiedClinician:true,clinicalRole:'doctor',organizationId:'o1'});fakes.membership.mockResolvedValue({data:()=>({active:true,clinicalRole:'doctor',organizationId:'o1'})});fakes.add.mockResolvedValue({id:'audit'});});
afterEach(() => {vi.unstubAllEnvs();vi.restoreAllMocks();});

describe('identity and clinical authorization',() => {
  it('checks token revocation and current server membership before clinical access',async() => {
    const next=vi.fn();await verifyAuth(request(),response(),next);await settle();
    expect(fakes.verifyIdToken).toHaveBeenCalledWith('synthetic-token',true);expect(next).toHaveBeenCalledOnce();
  });
  it('permits account lifecycle identity access without professional claims',async() => {
    fakes.verifyIdToken.mockResolvedValue({uid:'u1',auth_time:100});const next=vi.fn();await verifyIdentity(request(),response(),next);expect(next).toHaveBeenCalledOnce();
  });
  it('rejects self-selected roles, admin-only, revoked membership and cross-org access',async() => {
    for(const claims of [{role:'doctor'},{verifiedClinician:true,clinicalRole:'admin',organizationId:'o1'}]) {fakes.verifyIdToken.mockResolvedValue({uid:'u1',...claims});const res=response();const next=vi.fn();await verifyAuth(request(),res,next);await settle();expect(res.status).toHaveBeenCalledWith(403);expect(next).not.toHaveBeenCalled();}
    fakes.verifyIdToken.mockResolvedValue({uid:'u1',verifiedClinician:true,clinicalRole:'doctor',organizationId:'o1'});
    for(const membership of [{active:false,clinicalRole:'doctor',organizationId:'o1'},{active:true,clinicalRole:'doctor',organizationId:'other'}]) {fakes.membership.mockResolvedValue({data:()=>membership});const res=response();const next=vi.fn();await verifyAuth(request(),res,next);await settle();expect(res.status).toHaveBeenCalledWith(403);expect(next).not.toHaveBeenCalled();}
  });
  it('fails closed when verification or membership storage is unavailable',async() => {
    fakes.verifyIdToken.mockRejectedValueOnce(new Error('sensitive provider details'));const res=response();await verifyAuth(request(),res,vi.fn());expect(res.status).toHaveBeenCalledWith(401);
    fakes.membership.mockRejectedValueOnce(new Error('storage down'));const second=response();const next=vi.fn();await verifyAuth(request(),second,next);await settle();expect(second.status).toHaveBeenCalledWith(503);expect(next).not.toHaveBeenCalled();
  });
});
describe('App Check and fail-closed rate controls',() => {
  it('always enforces App Check outside explicit emulator mode even when flag false',async() => {
    vi.stubEnv('FUNCTIONS_EMULATOR','false');const res=response();const next=vi.fn();await verifyAppCheck(request(),res,next);expect(res.status).toHaveBeenCalledWith(401);expect(next).not.toHaveBeenCalled();
  });
  it('allows bypass only for the explicit local emulator',async() => {
    vi.stubEnv('FUNCTIONS_EMULATOR','true');const next=vi.fn();await verifyAppCheck(request(),response(),next);expect(next).toHaveBeenCalledOnce();
  });
  it('checks supplied tokens and rejects invalid attestations',async() => {
    vi.stubEnv('FUNCTIONS_EMULATOR','false');fakes.verifyAppCheck.mockRejectedValue(new Error('invalid'));const res=response();const next=vi.fn();await verifyAppCheck(request({header:()=> 'bad'}),res,next);expect(res.status).toHaveBeenCalledWith(401);expect(next).not.toHaveBeenCalled();
  });
  it('stores the first request at the current timestamp, not one window ago',async() => {
    const start=Date.now();const set=vi.fn();fakes.runTransaction.mockImplementation(async(callback) => callback({get:async()=>({exists:false}),set}));
    const next=vi.fn();await rateLimiter({windowMs:60_000,max:2})(request(),response(),next);expect(next).toHaveBeenCalledOnce();expect(set.mock.calls[0]![1]['/analyze'][0].windowStart).toBeGreaterThanOrEqual(start);
  });
  it('rejects a exhausted window and any storage failure without calling a paid provider',async() => {
    fakes.runTransaction.mockResolvedValueOnce({allowed:false,remaining:0});const next=vi.fn();const res=response();await rateLimiter({windowMs:60_000,max:2})(request(),res,next);expect(res.status).toHaveBeenCalledWith(429);expect(next).not.toHaveBeenCalled();
    fakes.runTransaction.mockRejectedValueOnce(new Error('down'));const failed=response();await rateLimiter({windowMs:60_000,max:2})(request(),failed,next);expect(failed.status).toHaveBeenCalledWith(503);expect(next).not.toHaveBeenCalled();
  });
});
describe('audit metadata minimization',() => {
  it('does not retain caller health fields, model excerpts or raw errors',async() => {
    await writeAuditLog({uid:'u1',action:'analyze',request:{patient:'SYNTHETIC-PHI'},responsePreview:'SYNTHETIC-PHI',success:false,error:'SYNTHETIC-PHI'});
    const saved=JSON.stringify(fakes.add.mock.calls[0]![0]);expect(saved).not.toContain('SYNTHETIC-PHI');expect(saved).toContain('expiresAt');
  });
  it('emits an observable safe event when audit writes fail',async() => {
    const log=vi.spyOn(console,'error').mockImplementation(()=>undefined);fakes.add.mockRejectedValueOnce(new Error('SYNTHETIC-PHI'));
    await writeAuditLog({uid:'u1',action:'analyze',request:{},responsePreview:'',success:true});expect(log).toHaveBeenCalledWith(JSON.stringify({event:'audit_write_failed',action:'analyze'}));
  });
});
