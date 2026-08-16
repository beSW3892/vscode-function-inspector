import * as vscode from 'vscode';

export class FileItem
extends vscode.TreeItem
{
    constructor(
        readonly uri:vscode.Uri
    )
    {
        super(
            vscode.workspace.asRelativePath(uri),
            vscode.TreeItemCollapsibleState.Collapsed
        );

        this.resourceUri = uri;
        this.iconPath = vscode.ThemeIcon.File;

        this.contextValue =
            "fileItem";
        
        this.command = {
            command:'functionInspector.openFile',
            title:'Open File',
            arguments:[this]
        };
    }
}