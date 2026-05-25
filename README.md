# Function Inspector

A lightweight VS Code extension for exploring functions, methods, and classes across your active file or entire workspace.

Browse code structure, inspect function statistics, jump to implementations, compare functions, and copy source code directly from the sidebar.

---

# Features

## Active File Mode

Command:

```txt
Function Inspector: Active File
```

Shows symbols from the currently open editor.

Displays:

* Functions
* Methods
* Classes
* Nested symbols *(language provider dependent)*

Includes:

* Function statistics
* Line counts
* Range information
* Collapse / Expand tree support

---

## Workspace Mode

Command:

```txt
Function Inspector: Workspace
```

Scans supported files across the workspace.

Features:

* File grouping
* File icons *(theme dependent)*
* Open files directly
* Browse functions by file
* Workspace statistics

Clicking a file node opens the editor.

---

## Sidebar Controls

### Refresh

Command:

```txt
Function Inspector: Refresh
```

Performs a **hard refresh**.

Clears:

* Symbol cache
* Statistics cache

Then rebuilds the tree.

Useful when:

* symbols stop updating
* language servers refresh
* extensions reload
* parser output changes

---

### Collapse All

Use the built-in **Collapse All** button in the tree view toolbar.

Quickly collapse the entire explorer tree.

---

## Function Actions

Available from function nodes.

### Select Function

Opens the source file and selects the full function body.

### Copy Function

Copies the full function source to the clipboard.

### Compare Functions

Select **two functions**.

Run:

```txt
Function Inspector: Compare Functions
```

Opens a VS Code diff view comparing both implementations.

---

# Command Palette Commands

Only these commands appear directly in the Command Palette:

| Command                               |
| ------------------------------------- |
| Function Inspector: Active File       |
| Function Inspector: Workspace         |
| ------------------------------------- |

Other actions are available through the explorer UI.

---

# Language Support

Function Inspector relies on:

```ts
vscode.executeDocumentSymbolProvider
```

Language support depends on installed symbol providers.

## Supported File Discovery

```txt
.c
.cpp
.cc
.h
.hpp
.cs
.py
.js
.ts
.jsx
.tsx
```

---

## Required Extensions

### JavaScript / TypeScript

Built into VS Code.

No installation required.

---

### Python

Install:

```txt
Python (Microsoft)
```

Recommended:

```txt
Pylance (Microsoft)
```

---

### C / C++

Install:

```txt
C/C++ (Microsoft)
```

---

### C#

Install ONE of:

```txt
C# Dev Kit (Microsoft)
```

or

```txt
C# (OmniSharp)
```

---

Without these extensions:

* no symbols may appear
* workspace results may be empty
* nested symbols may be missing

---

# Known Issues

## Symbol Availability

Languages expose symbol trees differently.

Examples:

* namespaces
* nested classes
* local functions
* language-specific parser behavior

Results vary by:

* language server
* extension version
* parser implementation

---

## Python isort Server Crashes

Some Python setups may display errors like:

```txt
isort client: couldn't create connection to server
The isort server crashed 5 times...
```

This can be caused by the Python environment or formatter extension.

## Nested Functions

Local functions and nested methods depend on the language provider.

Some languages may omit nested symbols.

---

# Release Notes

## 1.0.0

Initial release.

Features:

* Active file explorer
* Workspace mode
* Refresh / hard reset
* Function stats
* Compare functions
* Copy function source
* Function selection
* File opening
* Tree navigation
