import * as vscode from 'vscode';
import * as path from 'path';

export class FileItem
extends vscode.TreeItem
{
    constructor(
        readonly uri: vscode.Uri,
        showPath: boolean
    )
    {
        super(
            showPath
                ? vscode.workspace.asRelativePath(uri)
                : path.basename(uri.fsPath),
            vscode.TreeItemCollapsibleState.Collapsed
        );

        this.contextValue =
            "fileItem";

        this.resourceUri = uri;

        this.iconPath = new vscode.ThemeIcon('file');

        this.command =
        {
            command: "functionInspector.openFile",
            title: "Open File",
            arguments: [this]
        };
    }
}