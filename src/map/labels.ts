export type LabelCandidate = { id:string; x:number; y:number; width:number; height:number; priority:number };
export function resolveLabels(items: LabelCandidate[], bounds:{width:number;height:number}, padding=6):Set<string>{
 const occupied:LabelCandidate[]=[];
 const visible=new Set<string>();
 for(const item of [...items].sort((a,b)=>b.priority-a.priority)){
  if(item.x<0||item.y<0||item.x+item.width>bounds.width||item.y+item.height>bounds.height)continue;
  if(occupied.some(other=>item.x<other.x+other.width+padding&&item.x+item.width+padding>other.x&&item.y<other.y+other.height+padding&&item.y+item.height+padding>other.y))continue;
  occupied.push(item);visible.add(item.id);
 }
 return visible;
}
