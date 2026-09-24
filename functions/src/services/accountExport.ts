import { getFirestore } from 'firebase-admin/firestore';
import { CLINICAL_SCHEMA_VERSION, type AccountExportPage } from '../contracts/clinical.js';
import { ClinicalError,identifier } from './clinicalPolicy.js';
const collections: Record<string,{collection:string;field?:string;singleton?:boolean}> = {
  profile:{collection:'users',singleton:true},consents:{collection:'consents',singleton:true},
  clinical_memberships:{collection:'clinical_memberships',singleton:true},rate_limits:{collection:'rate_limits',singleton:true},
  consent_events:{collection:'consent_events',field:'ownerUid'},patients:{collection:'patients',field:'ownerUid'},legacy_patients:{collection:'patients',field:'userId'},
  encounters:{collection:'encounters',field:'ownerUid'},documents:{collection:'documents',field:'ownerUid'},transcriptions:{collection:'transcriptions',field:'ownerUid'},
  analyses:{collection:'analyses',field:'ownerUid'},reviews:{collection:'reviews',field:'ownerUid'},jobs:{collection:'jobs',field:'ownerUid'},
  referral_events:{collection:'referral_events',field:'ownerUid'},legacy_scans:{collection:'scans',field:'userId'},deletion_requests:{collection:'deletion_requests',field:'ownerUid'},
  audit_logs:{collection:'audit_logs',field:'uid'},daily_budgets:{collection:'daily_budgets',field:'ownerUid'},
};
export async function exportAccountPage(uid:string,collectionName='profile',limit=50,cursor?:string):Promise<AccountExportPage> {
  const definition=collections[collectionName];
  if(!definition || (cursor && !identifier.safeParse(cursor).success)) throw new ClinicalError('INVALID_EXPORT_CURSOR',400);
  const collection=getFirestore().collection(definition.collection);
  let items:Array<Record<string,unknown>>=[]; let nextCursor:string|null=null;
  if(definition.singleton) {
    if(cursor) throw new ClinicalError('INVALID_EXPORT_CURSOR',400);
    const snapshot=await collection.doc(uid).get();
    if(snapshot.exists) items=[{...snapshot.data(),id:snapshot.id}];
  } else {
    let query=collection.where(definition.field!,'==',uid).orderBy('__name__','asc');
    if(cursor) query=query.startAfter(cursor);
    const pageSize=Math.min(50,Math.max(1,Math.floor(limit)||50));
    const snapshot=await query.limit(pageSize+1).get(); let bytes=0;
    for(const record of snapshot.docs) {
      const item={...record.data(),id:record.id}; const size=Buffer.byteLength(JSON.stringify(item));
      if(items.length >= pageSize || (items.length>0 && bytes+size>4_000_000)) {nextCursor=String(items[items.length-1]!.id);break;}
      items.push(item);bytes+=size;
    }
  }
  return {schemaVersion:CLINICAL_SCHEMA_VERSION,exportedAt:new Date().toISOString(),collection:collectionName,availableCollections:Object.keys(collections),records:{items,nextCursor},scopeNotice:'Includes your retained structured application records across all listed collections, including legacy records. Source image bytes (available separately until expiry), provider-side records, infrastructure logs, and backups are not embedded. Contact the privacy lead for those stores and applicable retention/access procedures.'};
}
