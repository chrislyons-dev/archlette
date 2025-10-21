#!/usr/bin/env python3
"""Python AST parser for Archlette.

Parses Python source files and extracts:
- Module-level docstrings (for @module, @actor, @uses annotations)
- Classes (with methods, properties, decorators)
- Functions (with parameters, return types, decorators)
- Imports

Outputs JSON for consumption by TypeScript extractor.
"""

import ast
import json
import sys
import re
from typing import Any, Dict, List, Optional


def parse_file(file_path: str) -> Dict[str, Any]:
    """Parse a Python file and extract architecture info."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            source = f.read()
        
        tree = ast.parse(source, filename=file_path)
        
        return {
            'filePath': file_path,
            'component': extract_component(tree),
            'actors': extract_actors(tree),
            'relationships': extract_relationships(tree),
            'classes': extract_classes(tree),
            'functions': extract_functions(tree),
            'imports': extract_imports(tree),
        }
    except SyntaxError as e:
        return {
            'filePath': file_path,
            'component': None,
            'actors': [],
            'relationships': [],
            'classes': [],
            'functions': [],
            'imports': [],
            'parseError': f"Syntax error at line {e.lineno}: {e.msg}",
        }
    except Exception as e:
        return {
            'filePath': file_path,
            'component': None,
            'actors': [],
            'relationships': [],
            'classes': [],
            'functions': [],
            'imports': [],
            'parseError': str(e),
        }


def extract_component(tree: ast.Module) -> Optional[Dict[str, Any]]:
    """Extract @module/@component from module docstring."""
    docstring = ast.get_docstring(tree)
    if not docstring:
        return None
    
    # Look for @module, @component, or @namespace (in priority order)
    for tag in ['@module', '@component', '@namespace']:
        match = re.search(rf'{tag}\s+(\S+)', docstring)
        if match:
            name = match.group(1)
            
            # Extract description (everything before first @ tag or full docstring)
            description_match = re.match(r'^(.*?)(?=@)', docstring, re.DOTALL)
            description = description_match.group(1).strip() if description_match else docstring.strip()
            
            return {
                'name': name,
                'description': description if description else None,
            }
    
    return None


def extract_actors(tree: ast.Module) -> List[Dict[str, Any]]:
    """Extract @actor tags from module docstring.
    
    Format: @actor Name {Type} {Direction?} description
    Examples:
    - @actor User {Person} {in} End user
    - @actor Database {System} {out} PostgreSQL database
    """
    docstring = ast.get_docstring(tree)
    if not docstring:
        return []
    
    actors = []
    # Pattern: @actor Name {Person|System} {in|out|both}? description
    pattern = r'@actor\s+(\S+)\s+\{(Person|System)\}\s*(?:\{(in|out|both)\}\s*)?(.*?)(?=@|$)'
    
    for match in re.finditer(pattern, docstring, re.DOTALL):
        name = match.group(1)
        actor_type = match.group(2)
        direction = match.group(3) or 'both'
        description = match.group(4).strip() or None
        
        actors.append({
            'name': name,
            'type': actor_type,
            'direction': direction,
            'description': description,
        })
    
    return actors


def extract_relationships(tree: ast.Module) -> List[Dict[str, Any]]:
    """Extract @uses tags from module docstring.
    
    Format: @uses TargetComponent description
    """
    docstring = ast.get_docstring(tree)
    if not docstring:
        return []
    
    relationships = []
    # Pattern: @uses TargetName description
    pattern = r'@uses\s+(\S+)\s*(.*?)(?=@|$)'
    
    for match in re.finditer(pattern, docstring, re.DOTALL):
        target = match.group(1)
        description = match.group(2).strip() or None
        
        relationships.append({
            'target': target,
            'description': description,
        })
    
    return relationships


def extract_classes(tree: ast.Module) -> List[Dict[str, Any]]:
    """Extract all class definitions."""
    classes = []
    
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            # Only extract top-level classes (not nested classes)
            if isinstance(getattr(node, 'parent', None), ast.Module) or not hasattr(node, 'parent'):
                classes.append({
                    'name': node.name,
                    'baseClasses': [get_name(base) for base in node.bases],
                    'decorators': [get_decorator_name(dec) for dec in node.decorator_list],
                    'line': node.lineno,
                    'docstring': ast.get_docstring(node),
                    'methods': extract_methods(node),
                    'properties': extract_properties(node),
                })
    
    return classes


def extract_methods(class_node: ast.ClassDef) -> List[Dict[str, Any]]:
    """Extract methods from a class."""
    methods = []
    
    for node in class_node.body:
        if isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
            is_async = isinstance(node, ast.AsyncFunctionDef)
            is_static = any(get_decorator_name(d) == 'staticmethod' for d in node.decorator_list)
            is_classmethod = any(get_decorator_name(d) == 'classmethod' for d in node.decorator_list)
            is_abstract = any(get_decorator_name(d) == 'abstractmethod' for d in node.decorator_list)
            
            methods.append({
                'name': node.name,
                'isStatic': is_static,
                'isAsync': is_async,
                'isClassMethod': is_classmethod,
                'isAbstract': is_abstract,
                'decorators': [get_decorator_name(dec) for dec in node.decorator_list],
                'line': node.lineno,
                'docstring': ast.get_docstring(node),
                'parameters': extract_parameters(node),
                'returnAnnotation': get_annotation(node.returns) if node.returns else None,
            })
    
    return methods


def extract_properties(class_node: ast.ClassDef) -> List[Dict[str, Any]]:
    """Extract class-level properties (annotated assignments)."""
    properties = []
    
    for node in class_node.body:
        if isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            properties.append({
                'name': node.target.id,
                'annotation': get_annotation(node.annotation) if node.annotation else None,
                'default': ast.unparse(node.value) if node.value else None,
                'line': node.lineno,
            })
    
    return properties


def extract_functions(tree: ast.Module) -> List[Dict[str, Any]]:
    """Extract top-level functions."""
    functions = []
    
    for node in tree.body:
        if isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
            is_async = isinstance(node, ast.AsyncFunctionDef)
            
            functions.append({
                'name': node.name,
                'isAsync': is_async,
                'decorators': [get_decorator_name(dec) for dec in node.decorator_list],
                'line': node.lineno,
                'docstring': ast.get_docstring(node),
                'parameters': extract_parameters(node),
                'returnAnnotation': get_annotation(node.returns) if node.returns else None,
            })
    
    return functions


def extract_parameters(func_node) -> List[Dict[str, Any]]:
    """Extract function/method parameters."""
    params = []
    args = func_node.args
    
    # Regular arguments
    for i, arg in enumerate(args.args):
        # Skip 'self' and 'cls' parameters
        if arg.arg in ('self', 'cls'):
            continue
        
        # Get default value if exists
        default = None
        default_offset = len(args.args) - len(args.defaults)
        if i >= default_offset:
            default_value = args.defaults[i - default_offset]
            default = ast.unparse(default_value)
        
        params.append({
            'name': arg.arg,
            'annotation': get_annotation(arg.annotation) if arg.annotation else None,
            'default': default,
        })
    
    # *args
    if args.vararg:
        params.append({
            'name': f"*{args.vararg.arg}",
            'annotation': get_annotation(args.vararg.annotation) if args.vararg.annotation else None,
            'default': None,
        })
    
    # **kwargs
    if args.kwarg:
        params.append({
            'name': f"**{args.kwarg.arg}",
            'annotation': get_annotation(args.kwarg.annotation) if args.kwarg.annotation else None,
            'default': None,
        })
    
    return params


def extract_imports(tree: ast.Module) -> List[Dict[str, Any]]:
    """Extract import statements."""
    imports = []
    
    for node in tree.body:
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.append({
                    'source': alias.name,
                    'names': [alias.asname if alias.asname else alias.name],
                    'isRelative': False,
                    'level': 0,
                })
        elif isinstance(node, ast.ImportFrom):
            names = [alias.asname if alias.asname else alias.name for alias in node.names]
            imports.append({
                'source': node.module or '',
                'names': names,
                'isRelative': node.level > 0,
                'level': node.level,
            })
    
    return imports


def get_name(node) -> str:
    """Get name from various node types."""
    if isinstance(node, ast.Name):
        return node.id
    elif isinstance(node, ast.Attribute):
        return ast.unparse(node)
    else:
        return ast.unparse(node)


def get_decorator_name(node) -> str:
    """Get decorator name."""
    if isinstance(node, ast.Name):
        return node.id
    elif isinstance(node, ast.Call):
        return get_name(node.func)
    else:
        return ast.unparse(node)


def get_annotation(node) -> str:
    """Get type annotation as string."""
    try:
        return ast.unparse(node)
    except Exception:
        return str(node)


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No file paths provided'}))
        sys.exit(1)
    
    file_paths = sys.argv[1:]
    results = {
        'files': [parse_file(fp) for fp in file_paths]
    }
    
    print(json.dumps(results, indent=2))


if __name__ == '__main__':
    main()
