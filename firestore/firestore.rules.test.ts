import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertFails,assertSucceeds,initializeTestEnvironment,type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection,deleteDoc,doc,getDoc,getDocs,query,setDoc,updateDoc,where,serverTimestamp } from 'firebase/firestore';
import { ref,uploadBytes,getBytes,deleteObject } from 'firebase/storage';
import { afterAll,beforeAll,beforeEach,describe,it } from 'vitest';

let testEnv:RulesTestEnvironment;
const owner='owner-user'; const other='other-user'; const org='clinic-a';
const claims={verifiedClinician:true,clinicalRole:'doctor',organizationId:org};
const authedDb=(uid:string,token:Record<string,unknown>={}) => testEnv.authenticatedContext(uid,token).firestore();
const clinicianDb=(uid=owner,organizationId=org) => authedDb(uid,{...claims,organizationId});
const anonDb=() => testEnv.unauthenticatedContext().firestore();
const seed=async(path:string,data:Record<string,unknown>) => testEnv.withSecurityRulesDisabled(async(context) => {await setDoc(doc(context.firestore(),path),data);});
const membership=async(uid=owner,extra:Record<string,unknown>={}) => seed('clinical_memberships/'+uid,{active:true,clinicalRole:'doctor',organizationId:org,clinicalProcessing:true,...extra});
const hasStorage=Boolean(process.env.FIREBASE_STORAGE_EMULATOR_HOST);

beforeAll(async() => {
  testEnv=await initializeTestEnvironment({projectId:process.env.GCLOUD_PROJECT || 'demo-camdiag-hardening',firestore:{rules:readFileSync(resolve('firestore.rules'),'utf8')},...(hasStorage ? {storage:{rules:readFileSync(resolve('storage.rules'),'utf8')}} : {})});
});
beforeEach(async() => {await testEnv.clearFirestore();if(hasStorage) await testEnv.clearStorage();});
afterAll(async() => {await testEnv.cleanup();});

describe('profile field boundaries',() => {
  it('allows an owner basic profile fields but no self-granted role, organization or verification',async() => {
    const own=doc(authedDb(owner),'users/'+owner);
    await assertSucceeds(setDoc(own,{uid:owner,id:owner,name:'Synthetic User',email:'synthetic@example.test',createdAt:serverTimestamp()}));
    await assertSucceeds(updateDoc(own,{name:'Updated synthetic user',about:'Synthetic profile'}));
    await assertFails(updateDoc(own,{role:'admin'}));await assertFails(updateDoc(own,{verifiedClinician:true}));await assertFails(updateDoc(own,{organizationId:org}));
    await assertFails(updateDoc(own,{uid:other}));await assertFails(updateDoc(own,{createdAt:serverTimestamp()}));
    await assertFails(getDoc(doc(authedDb(other),'users/'+owner)));await assertFails(deleteDoc(own));
    await assertFails(setDoc(doc(authedDb(other),'users/'+other),{name:'User',role:'doctor'}));
  });
  it('preserves existing legacy role fields without allowing edits to them',async() => {
    await seed('users/'+owner,{name:'Legacy user',role:'doctor',photoUrl:'data:image/png;base64,synthetic',symptoms:'synthetic legacy field'});
    await assertSucceeds(updateDoc(doc(authedDb(owner),'users/'+owner),{name:'Edited user'}));
    await assertFails(updateDoc(doc(authedDb(owner),'users/'+owner),{role:'admin'}));
  });
  it('validates field shape, bounds and credential-independent ownership',async() => {
    await assertFails(setDoc(doc(authedDb(owner),'users/'+owner),{name:'x'.repeat(121)}));
    await assertFails(setDoc(doc(authedDb(owner),'users/'+owner),{photoUrl:'javascript:alert(1)'}));
    await assertFails(setDoc(doc(anonDb(),'users/'+owner),{name:'Anonymous'}));
  });
});
describe('authoritative clinical records and live membership',() => {
  it('permits owner clinician reads but forbids every client clinical write',async() => {
    await membership();
    for(const collectionName of ['patients','encounters','documents','transcriptions','analyses','reviews','jobs','referral_events']) {
      const path=collectionName+'/record-1';await seed(path,{ownerUid:owner,organizationId:org,status:'review_required'});
      const own=doc(clinicianDb(),path);await assertSucceeds(getDoc(own));await assertFails(updateDoc(own,{status:'reviewed'}));await assertFails(deleteDoc(own));
      await assertFails(setDoc(doc(clinicianDb(),collectionName+'/forged'),{ownerUid:owner,organizationId:org,status:'reviewed'}));
    }
  });
  it('rejects logged-in unverified users, admins, other owners and another organization',async() => {
    await membership();await membership(other);await seed('analyses/private',{ownerUid:owner,organizationId:org});
    await assertFails(getDoc(doc(authedDb(owner),'analyses/private')));
    await assertFails(getDoc(doc(authedDb(owner,{...claims,clinicalRole:'admin'}),'analyses/private')));
    await assertFails(getDoc(doc(clinicianDb(other),'analyses/private')));
    await assertFails(getDoc(doc(clinicianDb(owner,'clinic-b'),'analyses/private')));
    await assertFails(getDoc(doc(anonDb(),'analyses/private')));
  });
  it('revokes access immediately through membership even while claims remain valid',async() => {
    await membership();await seed('encounters/private',{ownerUid:owner,organizationId:org});
    const reference=doc(clinicianDb(),'encounters/private');await assertSucceeds(getDoc(reference));
    await membership(owner,{active:false});await assertFails(getDoc(reference));
  });
  it('requires owner and organization constraints in list queries',async() => {
    await membership();await seed('encounters/private',{ownerUid:owner,organizationId:org});
    await assertFails(getDocs(collection(clinicianDb(),'encounters')));
    await assertSucceeds(getDocs(query(collection(clinicianDb(),'encounters'),where('ownerUid','==',owner),where('organizationId','==',org))));
  });
});
describe('backend-only records',() => {
  it('never allows clients to forge quotas, uploads, audit, consent events or medication evidence',async() => {
    await membership();
    for(const collectionName of ['audit_logs','rate_limits','daily_budgets','uploads','deletion_requests','consent_events','medication_evidence']) {
      await seed(collectionName+'/one',{ownerUid:owner,organizationId:org});
      await assertFails(getDoc(doc(clinicianDb(),collectionName+'/one')));
      await assertFails(setDoc(doc(clinicianDb(),collectionName+'/two'),{ownerUid:owner,approved:true}));
    }
    await assertFails(setDoc(doc(clinicianDb(),'clinical_memberships/'+owner),{active:true}));
    await assertFails(setDoc(doc(clinicianDb(),'consents/'+owner),{clinicalProcessing:true}));
  });
  it('only serves approved drug references while keeping legacy scans immutable',async() => {
    await membership();await seed('drugs/approved',{approved:true});await seed('drugs/unreviewed',{name:'unreviewed'});await seed('scans/legacy',{userId:owner});
    await assertSucceeds(getDoc(doc(clinicianDb(),'drugs/approved')));
    await assertFails(getDoc(doc(clinicianDb(),'drugs/unreviewed')));
    await assertSucceeds(getDoc(doc(clinicianDb(),'scans/legacy')));
    await assertFails(updateDoc(doc(clinicianDb(),'scans/legacy'),{aiResponse:'forged'}));
  });
});
describe.skipIf(!hasStorage)('private source Storage rules',() => {
  const path='organizations/'+org+'/users/'+owner+'/encounters/e1/documents/d1/pages/p1';
  const bytes=new Uint8Array([137,80,78,71,13,10,26,10]);
  const prepare=async(extra:Record<string,unknown>={}) => {
    await membership();
    await seed('uploads/d1_p1',{ownerUid:owner,organizationId:org,encounterId:'e1',documentId:'d1',sizeBytes:bytes.length,mimeType:'image/png',expiresAtMs:Date.now()+60_000,...extra});
  };
  const storage=() => testEnv.authenticatedContext(owner,claims).storage();
  it('allows a manifest-bound upload/read but forbids overwrites, public reads and client deletion',async() => {
    await prepare();const file=ref(storage(),path);
    await assertSucceeds(uploadBytes(file,bytes,{contentType:'image/png'}));
    await assertSucceeds(getBytes(file));
    await assertFails(uploadBytes(file,bytes,{contentType:'image/png'}));
    await assertFails(getBytes(ref(testEnv.unauthenticatedContext().storage(),path)));
    await assertFails(deleteObject(file));
  });
  it('rejects mismatched size, type, unapproved path and expired uploads',async() => {
    await prepare();await assertFails(uploadBytes(ref(storage(),path),new Uint8Array([1]),{contentType:'image/png'}));
    await assertFails(uploadBytes(ref(storage(),path),bytes,{contentType:'application/pdf'}));
    await assertFails(uploadBytes(ref(storage(),path.replace('/p1','/unknown')),bytes,{contentType:'image/png'}));
    await prepare({expiresAtMs:Date.now()-1000});await assertFails(uploadBytes(ref(storage(),path),bytes,{contentType:'image/png'}));
  });
  it('stops source upload immediately after consent withdrawal or membership revocation',async() => {
    await prepare();await membership(owner,{clinicalProcessing:false});await assertFails(uploadBytes(ref(storage(),path),bytes,{contentType:'image/png'}));
    await membership(owner,{active:false});await assertFails(uploadBytes(ref(storage(),path),bytes,{contentType:'image/png'}));
  });
});
