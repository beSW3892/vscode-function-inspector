# Function Inspector

A lightweight VS Code extension for exploring functions, methods, and classes across your active file or entire workspace.

Function Inspector provides a tree-based view of your code structure with support for function statistics, source navigation, multi-selection, copying, comparison, and customizable display options.

# Features

## Active File Mode

Command:

```txt
Function Inspector: Active File
```

Shows symbols from the currently opened file editor.

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

## Sidebar Controls

### Refresh button

Performs a **hard refresh** by click the refresh symbol in the Function Inspector sidebar.

Clears:

* Symbol cache
* Statistics cache

Then rebuilds the tree.

Useful when:

* symbols stop updating
* language servers refresh
* extensions reload
* parser output changes

### Collapse All

Use the built-in **Collapse All** button in the tree view toolbar.

Quickly collapse the entire explorer tree.

### Display Settings

Available options include:

Toggle Function Details
    - Shows Number of lines and range
Toggle Parameters
    - Shows function name (dependent on symbol provider)
Toggle Paths
    - Shows only file name

These settings allow the tree to be customized depending on how much information you want displayed.

## Function Actions

Available from nodes in the Function Inspector view

### Select Function

Opens the source file and selects the full function body.

### Copy Function

Copies the full function source to the clipboard. Multiple functions can be selected and copied at once.

### Compare Functions

Select two functions and right click to select compare functions.

# Command Palette Commands

Only these commands appear directly in the Command Palette:

| Command                               |
| - |
| Function Inspector: Active File       |
| Function Inspector: Workspace         |
| - |

Other actions are available through the explorer UI.

# Language Support

Symbol discovery is therefore handled by the language provider extensions rather than by a custom parser built into Function Inspector.

This allows Function Inspector to work with any language that provides compatible document symbols.

Without these extensions:

* no symbols may appear
* workspace results may be empty
* nested symbols may be missing

## Caching

Function Inspector caches:

* document symbols
* calculated statistics

Use **Refresh Button** to perform a hard reset when results appear stale.

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


## Large Workspaces

Very large workspaces may experience slower scans.

Workspace mode currently searches supported source files and requests symbol information for discovered files.

Performance depends heavily on language provider performance.

## Python isort Server Crashes

Some Python setups may display errors like:

```txt
isort client: couldn't create connection to server
The isort server crashed 5 times...
```

This can be caused by the Python environment or formatter extension.

## Missing Functions/Classes

Local functions and nested methods depend on the language provider.

Some languages may omit nested symbols.



# Release Notes

## 1.0.0

Initial release.

Features:

* Active file explorer
* Workspace mode
* Refresh Button
* Function stats
* Compare functions
* Copy function source
* Function selection
* File opening
* Tree navigation

## 1.6.0

Updated for the love of the game

Features:

* Multiple function copying
* Customizable display settings
* Updated stats
    - Function parameters display
    - Function path display
    - Function detail display
* Expanded symbol support across a wider range of languages
