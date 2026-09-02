import * as vscode from 'vscode';

export class DetailItem extends vscode.TreeItem
{
    constructor(
        text: string
    )
    {
        super(
            text,
            vscode.TreeItemCollapsibleState.None
        );

        this.contextValue = "detailItem";
        this.command = undefined;
        this.iconPath = undefined;
    }
}