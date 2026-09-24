/** Deterministic in-memory adapter: throws on reads-after-writes just like Firestore. */
export class FakeFirestore {
  records=new Map<string,Record<string,any>>();
  operations:string[]=[];
  serial=0;
  clear(){this.records.clear();this.operations=[];this.serial=0;}
  doc(path:string):any {
    const db=this;return {id:path.split('/').at(-1),path,get:async()=>db.snapshot(path),set:async(data:any,options?:any)=>db.write('set',path,data,options),create:async(data:any)=>db.write('create',path,data),update:async(data:any)=>db.write('update',path,data),delete:async()=>{db.records.delete(path);db.operations.push('delete '+path);}};
  }
  snapshot(path:string):any {const data=this.records.get(path);return {id:path.split('/').at(-1),ref:this.doc(path),exists:Boolean(data),data:()=>data ? structuredClone(data) : undefined};}
  collection(name:string):any {
    const db=this;let filters:Array<[string,string,any]>=[];let orders:Array<[string,string]>=[];let count=Infinity;let after:any;
    const query:any={_collection:name,doc:(id?:string)=>db.doc(name+'/'+(id??'auto-'+(++db.serial))),add:async(data:any)=>{const ref=db.doc(name+'/auto-'+(++db.serial));await ref.create(data);return ref;},where:(...args:[string,string,any])=>{filters.push(args);return query;},orderBy:(field:string,direction='asc')=>{orders.push([field,direction]);return query;},limit:(n:number)=>{count=n;return query;},startAfter:(value:any)=>{after=value;return query;},get:async()=>{
      let entries=[...db.records].filter(([path])=>path.startsWith(name+'/') && path.split('/').length===2).map(([path])=>db.snapshot(path));
      for(const [field,op,value] of filters) entries=entries.filter((doc:any)=>op==='==' ? doc.data()[field]===value : op==='in' ? value.includes(doc.data()[field]) : op==='<=' ? doc.data()[field]<=value : false);
      entries.sort((a:any,b:any)=>{for(const [field,direction] of orders){const av=field==='__name__'?a.id:a.data()[field],bv=field==='__name__'?b.id:b.data()[field];if(av===bv)continue;return(av<bv?-1:1)*(direction==='desc'?-1:1);}return 0;});
      if(after){const index=entries.findIndex((doc:any)=>doc.id===(typeof after==='string'?after:after.id));entries=index<0?entries:entries.slice(index+1);}
      const docs=entries.slice(0,count);return {docs,size:docs.length,empty:docs.length===0};
    }};return query;
  }
  async getAll(...refs:any[]){return Promise.all(refs.map(ref=>ref.get()));}
  write(kind:string,path:string,data:any,options?:any){
    if(kind==='create'&&this.records.has(path))throw new Error('ALREADY_EXISTS');
    if(kind==='update'&&!this.records.has(path))throw new Error('NOT_FOUND');
    const next=kind==='update'||options?.merge?{...this.records.get(path),...data}:{...data};
    for(const key of Object.keys(next)){if(next[key]==='__DELETE_FIELD__')delete next[key];if(next[key]===undefined)throw new Error('UNDEFINED_FIELD');}
    this.records.set(path,structuredClone(next));this.operations.push(kind+' '+path);
  }
  batch(){const writes:Array<()=>void>=[];const batch:any={set:(ref:any,data:any,options:any)=>writes.push(()=>this.write('set',ref.path,data,options)),create:(ref:any,data:any)=>writes.push(()=>this.write('create',ref.path,data)),update:(ref:any,data:any)=>writes.push(()=>this.write('update',ref.path,data)),delete:(ref:any)=>writes.push(()=>this.records.delete(ref.path)),commit:async()=>writes.forEach(write=>write())};return batch;}
  async runTransaction<T>(callback:(transaction:any)=>Promise<T>){let writing=false;const writes:Array<()=>void>=[];const transaction={get:async(ref:any)=>{if(writing)throw new Error('READ_AFTER_WRITE');return ref.get();},set:(ref:any,data:any,options?:any)=>{writing=true;writes.push(()=>this.write('set',ref.path,data,options));},create:(ref:any,data:any)=>{writing=true;writes.push(()=>this.write('create',ref.path,data));},update:(ref:any,data:any)=>{writing=true;writes.push(()=>this.write('update',ref.path,data));}};const value=await callback(transaction);writes.forEach(write=>write());return value;}
}
