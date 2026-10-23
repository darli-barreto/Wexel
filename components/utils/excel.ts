import type { CellData } from "../TableExcel";

export function parseCellRef(ref: string, rowsLength: number, columnsLength: number): { row: number; col: number } | null {
  const match = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;

  const colLetters = match[1].toUpperCase();
  const rowNum = parseInt(match[2]);

  let colIndex = 0;
  for (let i = 0; i < colLetters.length; i++) {
    colIndex = colIndex * 26 + (colLetters.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  colIndex -= 1;

  const rowIndex = rowNum - 1;

  if (rowIndex >= 0 && rowIndex < rowsLength && colIndex >= 0 && colIndex < columnsLength) {
    return { row: rowIndex, col: colIndex };
  }
  return null;
}

type Position = { row: number; col: number };
type Value = number | number[];
class FormulaError extends Error {}

/** A small expression parser: formulas are data, never JavaScript. */
function calculate(expression: string, read: (reference: string) => number | null, range: (from: string, to: string) => number[]): number {
  const tokens = expression.match(/\$?[A-Z]+\$?\d+|[A-Z_]+|(?:\d+\.?\d*|\.\d+)(?:E[+-]?\d+)?|[+*/^%(),;:\-]/gi) ?? [];
  if (tokens.join('').toUpperCase() !== expression.replace(/\s/g, '').toUpperCase() || !tokens.length) throw new FormulaError('#ERROR!');
  let index = 0;
  const peek = () => tokens[index]?.toUpperCase();
  const take = (token: string) => { if (peek() !== token) throw new FormulaError('#ERROR!'); index++; };
  const scalar = (value: Value): number => { if (Array.isArray(value)) throw new FormulaError('#VALUE!'); return value; };
  const reference = (token: string) => /^\$?[A-Z]+\$?\d+$/i.test(token);
  function primary(): Value {
    const token = peek();
    if (!token) throw new FormulaError('#ERROR!');
    if (token === '(') { index++; const value = expressionValue(); take(')'); return value; }
    if (reference(token)) { index++; if(peek() === ':'){index++;const end=peek();if(!end||!reference(end))throw new FormulaError('#REF!');index++;return range(token,end);}return read(token) ?? 0; }
    if (/^[A-Z_]+$/.test(token)) {
      index++; take('('); const values: number[] = [];
      if(peek() !== ')') do {
        // Ignore empty/text cells in aggregates, as Excel does for cell references.
        const next=peek();
        if(next && reference(next) && [',',';',')'].includes(tokens[index+1])) { index++;const value=read(next);if(value!==null)values.push(value); }
        else {const value=expressionValue();values.push(...(Array.isArray(value)?value:[value]));}
        if(peek()!==','&&peek()!==';')break;index++;
      } while(true);
      take(')');
      switch(token){
        case 'SUM':case 'SUMA':return values.reduce((a,b)=>a+b,0);
        case 'PRODUCT':case 'PRODUCTO':return values.length?values.reduce((a,b)=>a*b,1):0;
        case 'AVERAGE':case 'PROMEDIO':if(!values.length)throw new FormulaError('#DIV/0!');return values.reduce((a,b)=>a+b,0)/values.length;
        case 'MIN':return values.length?Math.min(...values):0;
        case 'MAX':return values.length?Math.max(...values):0;
        case 'COUNT':case 'CONTAR':return values.length;
        default:throw new FormulaError('#NAME?');
      }
    }
    if(!/^(?:\d+\.?\d*|\.\d+)(?:E[+-]?\d+)?$/i.test(token))throw new FormulaError('#ERROR!');
    index++;return Number(token);
  }
  function unary(): Value {if(peek()==='+'||peek()==='-'){const sign=peek()==='-'?-1:1;index++;return sign*scalar(unary());}let value=primary();while(peek()==='%'){index++;value=scalar(value)/100;}return value;}
  function power(): Value {let value=unary();while(peek()==='^'){index++;value=scalar(value)**scalar(unary());}return value;}
  function product(): Value {let value=power();while(peek()==='*'||peek()==='/'){const op=peek();index++;const right=scalar(power());if(op==='/'&&right===0)throw new FormulaError('#DIV/0!');value=op==='*'?scalar(value)*right:scalar(value)/right;}return value;}
  function expressionValue(): Value {let value=product();while(peek()==='+'||peek()==='-'){const op=peek();index++;const right=scalar(product());value=op==='+'?scalar(value)+right:scalar(value)-right;}return value;}
  const value=scalar(expressionValue());
  if(index!==tokens.length)throw new FormulaError('#ERROR!');
  if(!Number.isFinite(value))throw new FormulaError('#NUM!');
  return value;
}

function evaluateFormula(expression: string, cells: CellData[][], rowCount: number, colCount: number, dependencies: Position[], visiting = new Set<string>()): number {
  const position = (ref: string) => {
    const pos=parseCellRef(ref.replaceAll('$',''),rowCount,colCount);
    if(!pos)throw new FormulaError('#REF!');
    if(!dependencies.some(d=>d.row===pos.row&&d.col===pos.col))dependencies.push(pos);
    return pos;
  };
  const read = (ref: string): number | null => {
    const pos=position(ref), key=pos.row+':'+pos.col, cell=cells[pos.row]?.[pos.col];
    if(!cell||!cell.rawValue.trim())return null;
    if(cell.rawValue.startsWith('=')) {
      if(visiting.has(key))throw new FormulaError('#CIRC!');
      visiting.add(key);
      try {return evaluateFormula(cell.rawValue.slice(1),cells,rowCount,colCount,[],visiting);}finally{visiting.delete(key);}
    }
    const value=Number(cell.rawValue);return Number.isFinite(value)?value:null;
  };
  return calculate(expression,read,(from,to)=>{
    const a=position(from),b=position(to),values:number[]=[];
    for(let r=Math.min(a.row,b.row);r<=Math.max(a.row,b.row);r++)for(let c=Math.min(a.col,b.col);c<=Math.max(a.col,b.col);c++){
      let n=c+1,letters='';while(n){n--;letters=String.fromCharCode(65+n%26)+letters;n=Math.floor(n/26);}
      const value=read(letters+(r+1));if(value!==null)values.push(value);
    }return values;
  });
}
export function evaluateExpression(expression: string, cellData: CellData[][], rowsLength: number, columnsLength: number): number {
  return evaluateFormula(expression,cellData,rowsLength,columnsLength,[]);
}
export function processFormula(formula: string, cellData: CellData[][], rows: string[], columns: string[]): { displayValue: string; dependencies: Position[] } {
  if(!formula.startsWith('='))return {displayValue:formula,dependencies:[]};
  const dependencies:Position[]=[];
  // A bare equals sign is an unfinished draft, not an executable expression.
  if(!formula.slice(1).trim())return {displayValue:'',dependencies};
  try {return {displayValue:String(evaluateFormula(formula.slice(1),cellData,rows.length,columns.length,dependencies)),dependencies};}
  catch(error){return {displayValue:error instanceof FormulaError?error.message:'#ERROR!',dependencies};}
}
