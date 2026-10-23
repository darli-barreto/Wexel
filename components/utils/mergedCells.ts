export interface MergeCell { hidden: boolean; colSpan: number; rowSpan: number; row: number; col: number }
const cache = new WeakMap<string[], Map<string,MergeCell>>();
const position=(address:string)=>{const match=address.match(/^([A-Z]+)(\d+)$/)!;let col=0;for(const c of match[1])col=col*26+c.charCodeAt(0)-64;return{row:Number(match[2])-1,col:col-1};};
export function mergedCells(ranges?: string[]) {
  if (!ranges) return undefined;
  const saved=cache.get(ranges);if(saved)return saved;
  const cells=new Map<string,MergeCell>();
  for(const range of ranges){const [start,end]=range.split(':');const a=position(start),b=position(end??start);
    for(let r=a.row;r<=b.row;r++)for(let c=a.col;c<=b.col;c++)cells.set(String.fromCharCode(65+c)+(r+1),{hidden:r!==a.row||c!==a.col,colSpan:b.col-a.col+1,rowSpan:b.row-a.row+1,...a});
  }
  cache.set(ranges,cells);return cells;
}
