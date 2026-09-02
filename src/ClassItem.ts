// import * as vscode from 'vscode';
// import { SymbolItem } from './SymbolItem';

// export class FunctionItem extends SymbolItem
// {
//     constructor(
//         symbol: vscode.DocumentSymbol,
//         uri: vscode.Uri,
//         showDetails: boolean
//     )
//     {
//         super(
//             symbol,
//             uri,
//             symbol.children.length > 0
//                 ? vscode.TreeItemCollapsibleState.Collapsed
//                 : vscode.TreeItemCollapsibleState.None
//         );

//         this.contextValue = "functionItem";

//         if(showDetails)
//         {
//             this.description =
//                 `${symbol.range.start.line + 1}-${symbol.range.end.line + 1}`;
//         }
//     }
// }