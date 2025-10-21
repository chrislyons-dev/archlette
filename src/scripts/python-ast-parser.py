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


class DocstringParser:
    """Parse docstrings in Google, NumPy, and Sphinx styles.
    
    Extracts:
    - Summary (first line/paragraph)
    - Description (detailed description)
    - Args/Parameters (with types and descriptions)
    - Returns (with type and description)
    - Raises/Exceptions (with types and descriptions)
    - Examples
    """
    
    def parse(self, docstring: Optional[str]) -> Dict[str, Any]:
        """Parse a docstring and extract structured information."""
        if not docstring:
            return {
                'summary': None,
                'description': None,
                'args': [],
                'returns': None,
                'raises': [],
                'examples': None,
            }
        
        # Detect style and parse accordingly
        if self._is_google_style(docstring):
            return self._parse_google(docstring)
        elif self._is_numpy_style(docstring):
            return self._parse_numpy(docstring)
        elif self._is_sphinx_style(docstring):
            return self._parse_sphinx(docstring)
        else:
            # Simple style - just summary and description
            return self._parse_simple(docstring)
    
    def _is_google_style(self, docstring: str) -> bool:
        """Check if docstring uses Google style."""
        return bool(re.search(r'\n\s*(Args|Returns|Yields|Raises|Note|Example|Attributes):\s*\n', docstring))
    
    def _is_numpy_style(self, docstring: str) -> bool:
        """Check if docstring uses NumPy style."""
        return bool(re.search(r'\n\s*(Parameters|Returns|Yields|Raises|See Also|Notes|Examples)\s*\n\s*-+\s*\n', docstring))
    
    def _is_sphinx_style(self, docstring: str) -> bool:
        """Check if docstring uses Sphinx/reST style."""
        return bool(re.search(r':(param|type|returns?|rtype|raises?)(\s+\w+)?:', docstring))
    
    def _parse_google(self, docstring: str) -> Dict[str, Any]:
        """Parse Google-style docstring."""
        lines = docstring.split('\n')
        sections = self._split_sections_google(lines)
        
        result = {
            'summary': sections.get('summary'),
            'description': sections.get('description'),
            'args': [],
            'returns': None,
            'raises': [],
            'examples': sections.get('Examples') or sections.get('Example'),
        }
        
        # Parse Args section
        if 'Args' in sections or 'Arguments' in sections:
            args_text = sections.get('Args') or sections.get('Arguments')
            result['args'] = self._parse_args_google(args_text)
        
        # Parse Returns section
        if 'Returns' in sections:
            result['returns'] = self._parse_returns_google(sections['Returns'])
        
        # Parse Raises section
        if 'Raises' in sections:
            result['raises'] = self._parse_raises_google(sections['Raises'])
        
        return result
    
    def _parse_numpy(self, docstring: str) -> Dict[str, Any]:
        """Parse NumPy-style docstring."""
        lines = docstring.split('\n')
        sections = self._split_sections_numpy(lines)
        
        result = {
            'summary': sections.get('summary'),
            'description': sections.get('description'),
            'args': [],
            'returns': None,
            'raises': [],
            'examples': sections.get('Examples'),
        }
        
        # Parse Parameters section
        if 'Parameters' in sections:
            result['args'] = self._parse_args_numpy(sections['Parameters'])
        
        # Parse Returns section
        if 'Returns' in sections:
            result['returns'] = self._parse_returns_numpy(sections['Returns'])
        
        # Parse Raises section
        if 'Raises' in sections:
            result['raises'] = self._parse_raises_numpy(sections['Raises'])
        
        return result
    
    def _parse_sphinx(self, docstring: str) -> Dict[str, Any]:
        """Parse Sphinx/reST-style docstring."""
        lines = docstring.split('\n')
        
        # Extract summary (first line until blank line or field list)
        summary_lines = []
        description_lines = []
        in_summary = True
        in_description = False
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            if not line:
                if in_summary:
                    in_summary = False
                    in_description = True
                i += 1
                continue
            
            if line.startswith(':'):
                break
            
            if in_summary:
                summary_lines.append(line)
            elif in_description:
                description_lines.append(line)
            
            i += 1
        
        result = {
            'summary': ' '.join(summary_lines) if summary_lines else None,
            'description': ' '.join(description_lines) if description_lines else None,
            'args': [],
            'returns': None,
            'raises': [],
            'examples': None,
        }
        
        # Parse field lists
        param_pattern = r':param\s+(\w+):\s*(.+)'
        type_pattern = r':type\s+(\w+):\s*(.+)'
        return_pattern = r':returns?:\s*(.+)'
        rtype_pattern = r':rtype:\s*(.+)'
        raises_pattern = r':raises?\s+(\w+):\s*(.+)'
        
        param_types = {}
        
        for line in lines[i:]:
            line = line.strip()
            
            # :param name: description
            param_match = re.match(param_pattern, line)
            if param_match:
                name = param_match.group(1)
                desc = param_match.group(2)
                result['args'].append({
                    'name': name,
                    'type': param_types.get(name),
                    'description': desc,
                })
                continue
            
            # :type name: type
            type_match = re.match(type_pattern, line)
            if type_match:
                name = type_match.group(1)
                param_type = type_match.group(2)
                param_types[name] = param_type
                # Update existing param if already added
                for arg in result['args']:
                    if arg['name'] == name:
                        arg['type'] = param_type
                continue
            
            # :returns: description
            return_match = re.match(return_pattern, line)
            if return_match:
                if result['returns'] is None:
                    result['returns'] = {}
                result['returns']['description'] = return_match.group(1)
                continue
            
            # :rtype: type
            rtype_match = re.match(rtype_pattern, line)
            if rtype_match:
                if result['returns'] is None:
                    result['returns'] = {}
                result['returns']['type'] = rtype_match.group(1)
                continue
            
            # :raises ExceptionType: description
            raises_match = re.match(raises_pattern, line)
            if raises_match:
                result['raises'].append({
                    'type': raises_match.group(1),
                    'description': raises_match.group(2),
                })
                continue
        
        return result
    
    def _parse_simple(self, docstring: str) -> Dict[str, Any]:
        """Parse simple docstring (just summary and description)."""
        lines = [line.strip() for line in docstring.split('\n')]
        
        # First non-empty line is summary
        summary = None
        description_lines = []
        found_summary = False
        
        for line in lines:
            if not line:
                continue
            
            # Skip @tags for simple parsing
            if line.startswith('@'):
                continue
            
            if not found_summary:
                summary = line
                found_summary = True
            else:
                description_lines.append(line)
        
        return {
            'summary': summary,
            'description': ' '.join(description_lines) if description_lines else None,
            'args': [],
            'returns': None,
            'raises': [],
            'examples': None,
        }
    
    def _split_sections_google(self, lines: List[str]) -> Dict[str, str]:
        """Split Google-style docstring into sections."""
        sections = {}
        current_section = 'summary'
        current_lines = []
        
        section_keywords = ['Args', 'Arguments', 'Returns', 'Yields', 'Raises', 
                           'Note', 'Notes', 'Example', 'Examples', 'Attributes']
        
        for line in lines:
            stripped = line.strip()
            
            # Check if this is a section header
            if stripped.rstrip(':') in section_keywords and stripped.endswith(':'):
                # Save previous section
                if current_lines:
                    if current_section == 'summary':
                        # First paragraph is summary, rest is description
                        summary_end = 0
                        for i, l in enumerate(current_lines):
                            if not l.strip():
                                summary_end = i
                                break
                        if summary_end == 0:
                            sections['summary'] = ' '.join(current_lines).strip()
                        else:
                            sections['summary'] = ' '.join(current_lines[:summary_end]).strip()
                            sections['description'] = ' '.join(current_lines[summary_end:]).strip()
                    else:
                        sections[current_section] = '\n'.join(current_lines).strip()
                
                # Start new section
                current_section = stripped.rstrip(':')
                current_lines = []
            else:
                current_lines.append(line)
        
        # Save last section
        if current_lines:
            if current_section == 'summary':
                summary_end = 0
                for i, l in enumerate(current_lines):
                    if not l.strip():
                        summary_end = i
                        break
                if summary_end == 0:
                    sections['summary'] = ' '.join(current_lines).strip()
                else:
                    sections['summary'] = ' '.join(current_lines[:summary_end]).strip()
                    sections['description'] = ' '.join(current_lines[summary_end:]).strip()
            else:
                sections[current_section] = '\n'.join(current_lines).strip()
        
        return sections
    
    def _split_sections_numpy(self, lines: List[str]) -> Dict[str, str]:
        """Split NumPy-style docstring into sections."""
        sections = {}
        current_section = 'summary'
        current_lines = []
        
        section_keywords = ['Parameters', 'Returns', 'Yields', 'Raises', 
                           'See Also', 'Notes', 'Examples', 'Attributes']
        
        i = 0
        while i < len(lines):
            line = lines[i]
            stripped = line.strip()
            
            # Check if this is a section header (followed by dashes)
            if i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                if stripped in section_keywords and re.match(r'^-+$', next_line):
                    # Save previous section
                    if current_lines:
                        if current_section == 'summary':
                            summary_end = 0
                            for idx, l in enumerate(current_lines):
                                if not l.strip():
                                    summary_end = idx
                                    break
                            if summary_end == 0:
                                sections['summary'] = ' '.join(current_lines).strip()
                            else:
                                sections['summary'] = ' '.join(current_lines[:summary_end]).strip()
                                sections['description'] = ' '.join(current_lines[summary_end:]).strip()
                        else:
                            sections[current_section] = '\n'.join(current_lines).strip()
                    
                    # Start new section
                    current_section = stripped
                    current_lines = []
                    i += 2  # Skip header and dashes
                    continue
            
            current_lines.append(line)
            i += 1
        
        # Save last section
        if current_lines:
            if current_section == 'summary':
                summary_end = 0
                for idx, l in enumerate(current_lines):
                    if not l.strip():
                        summary_end = idx
                        break
                if summary_end == 0:
                    sections['summary'] = ' '.join(current_lines).strip()
                else:
                    sections['summary'] = ' '.join(current_lines[:summary_end]).strip()
                    sections['description'] = ' '.join(current_lines[summary_end:]).strip()
            else:
                sections[current_section] = '\n'.join(current_lines).strip()
        
        return sections
    
    def _parse_args_google(self, args_text: str) -> List[Dict[str, Any]]:
        """Parse Args section in Google style.
        
        Format:
            arg_name (type): description
            arg_name: description
        """
        args = []
        current_arg = None
        
        for line in args_text.split('\n'):
            stripped = line.strip()
            if not stripped:
                continue
            
            # Check if this is a new arg (starts at beginning of line after indent)
            if not line.startswith(' ' * 8):  # Not a continuation
                # Match: name (type): description or name: description
                match = re.match(r'(\w+)\s*(?:\(([^)]+)\))?\s*:\s*(.+)', stripped)
                if match:
                    if current_arg:
                        args.append(current_arg)
                    
                    current_arg = {
                        'name': match.group(1),
                        'type': match.group(2),
                        'description': match.group(3),
                    }
            elif current_arg:
                # Continuation of description
                current_arg['description'] += ' ' + stripped
        
        if current_arg:
            args.append(current_arg)
        
        return args
    
    def _parse_args_numpy(self, args_text: str) -> List[Dict[str, Any]]:
        """Parse Parameters section in NumPy style.
        
        Format:
            name : type
                description
        """
        args = []
        current_arg = None
        
        for line in args_text.split('\n'):
            stripped = line.strip()
            if not stripped:
                continue
            
            # Check if this is a new parameter (name : type)
            if ':' in stripped and not line.startswith(' ' * 4):
                if current_arg:
                    args.append(current_arg)
                
                parts = stripped.split(':', 1)
                name = parts[0].strip()
                param_type = parts[1].strip() if len(parts) > 1 else None
                
                current_arg = {
                    'name': name,
                    'type': param_type,
                    'description': '',
                }
            elif current_arg:
                # Description line
                if current_arg['description']:
                    current_arg['description'] += ' '
                current_arg['description'] += stripped
        
        if current_arg:
            args.append(current_arg)
        
        return args
    
    def _parse_returns_google(self, returns_text: str) -> Dict[str, Any]:
        """Parse Returns section in Google style.
        
        Format:
            type: description
            description
        """
        stripped = returns_text.strip()
        
        # Try to match: type: description
        match = re.match(r'(\w+(?:\[.*?\])?)\s*:\s*(.+)', stripped, re.DOTALL)
        if match:
            return {
                'type': match.group(1),
                'description': match.group(2).strip(),
            }
        else:
            return {
                'type': None,
                'description': stripped,
            }
    
    def _parse_returns_numpy(self, returns_text: str) -> Dict[str, Any]:
        """Parse Returns section in NumPy style.
        
        Format:
            type
                description
        """
        lines = returns_text.strip().split('\n')
        if not lines:
            return {'type': None, 'description': None}
        
        # First line is type
        return_type = lines[0].strip()
        # Rest is description
        description = ' '.join(line.strip() for line in lines[1:] if line.strip())
        
        return {
            'type': return_type if return_type else None,
            'description': description if description else None,
        }
    
    def _parse_raises_google(self, raises_text: str) -> List[Dict[str, Any]]:
        """Parse Raises section in Google style."""
        raises = []
        current_raise = None
        
        for line in raises_text.split('\n'):
            stripped = line.strip()
            if not stripped:
                continue
            
            # Match: ExceptionType: description
            if not line.startswith(' ' * 8):
                match = re.match(r'(\w+)\s*:\s*(.+)', stripped)
                if match:
                    if current_raise:
                        raises.append(current_raise)
                    
                    current_raise = {
                        'type': match.group(1),
                        'description': match.group(2),
                    }
            elif current_raise:
                current_raise['description'] += ' ' + stripped
        
        if current_raise:
            raises.append(current_raise)
        
        return raises
    
    def _parse_raises_numpy(self, raises_text: str) -> List[Dict[str, Any]]:
        """Parse Raises section in NumPy style."""
        raises = []
        current_raise = None
        
        for line in raises_text.split('\n'):
            stripped = line.strip()
            if not stripped:
                continue
            
            # Exception type on its own line
            if not line.startswith(' ' * 4):
                if current_raise:
                    raises.append(current_raise)
                
                current_raise = {
                    'type': stripped,
                    'description': '',
                }
            elif current_raise:
                if current_raise['description']:
                    current_raise['description'] += ' '
                current_raise['description'] += stripped
        
        if current_raise:
            raises.append(current_raise)
        
        return raises


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
            'types': extract_types(tree),
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
            'types': [],
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
            'types': [],
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
    docstring_parser = DocstringParser()
    
    for node in class_node.body:
        if isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
            is_async = isinstance(node, ast.AsyncFunctionDef)
            is_static = any(get_decorator_name(d) == 'staticmethod' for d in node.decorator_list)
            is_classmethod = any(get_decorator_name(d) == 'classmethod' for d in node.decorator_list)
            is_abstract = any(get_decorator_name(d) == 'abstractmethod' for d in node.decorator_list)
            
            # Parse docstring for structured data
            docstring = ast.get_docstring(node)
            parsed_doc = docstring_parser.parse(docstring)
            
            methods.append({
                'name': node.name,
                'isStatic': is_static,
                'isAsync': is_async,
                'isClassMethod': is_classmethod,
                'isAbstract': is_abstract,
                'decorators': [get_decorator_name(dec) for dec in node.decorator_list],
                'line': node.lineno,
                'docstring': docstring,
                'parsedDoc': parsed_doc,
                'parameters': extract_parameters(node),
                'returnAnnotation': get_annotation(node.returns) if node.returns else None,
            })
    
    return methods


def extract_properties(class_node: ast.ClassDef) -> List[Dict[str, Any]]:
    """Extract class-level properties and @property decorators."""
    properties = []
    
    # Track property methods to detect getters/setters
    property_methods = {}
    
    # First pass: Find all @property decorated methods
    for node in class_node.body:
        if isinstance(node, ast.FunctionDef):
            # Check for @property decorator
            has_property = any(get_decorator_name(d) == 'property' for d in node.decorator_list)
            
            if has_property:
                property_methods[node.name] = {
                    'name': node.name,
                    'type': 'property',
                    'hasGetter': True,
                    'hasSetter': False,
                    'hasDeleter': False,
                    'line': node.lineno,
                    'docstring': ast.get_docstring(node),
                    'returnAnnotation': get_annotation(node.returns) if node.returns else None,
                }
            
            # Check for setter (e.g., @name.setter)
            for dec in node.decorator_list:
                dec_name = get_decorator_name(dec)
                if dec_name.endswith('.setter'):
                    prop_name = dec_name.replace('.setter', '')
                    if prop_name in property_methods:
                        property_methods[prop_name]['hasSetter'] = True
                
                # Check for deleter (e.g., @name.deleter)
                if dec_name.endswith('.deleter'):
                    prop_name = dec_name.replace('.deleter', '')
                    if prop_name in property_methods:
                        property_methods[prop_name]['hasDeleter'] = True
    
    # Add property decorators to results
    for prop in property_methods.values():
        properties.append({
            'name': prop['name'],
            'type': 'property',
            'annotation': prop['returnAnnotation'],
            'default': None,
            'line': prop['line'],
            'docstring': prop['docstring'],
            'isReadonly': prop['hasGetter'] and not prop['hasSetter'],
            'hasGetter': prop['hasGetter'],
            'hasSetter': prop['hasSetter'],
            'hasDeleter': prop['hasDeleter'],
        })
    
    # Second pass: Extract class variable annotations
    for node in class_node.body:
        if isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            # Skip if this is a property (already handled above)
            if node.target.id not in property_methods:
                properties.append({
                    'name': node.target.id,
                    'type': 'class_variable',
                    'annotation': get_annotation(node.annotation) if node.annotation else None,
                    'default': ast.unparse(node.value) if node.value else None,
                    'line': node.lineno,
                    'docstring': None,
                    'isReadonly': False,  # Can't determine from annotation alone
                    'hasGetter': False,
                    'hasSetter': False,
                    'hasDeleter': False,
                })
    
    return properties


def extract_functions(tree: ast.Module) -> List[Dict[str, Any]]:
    """Extract top-level functions."""
    functions = []
    docstring_parser = DocstringParser()
    
    for node in tree.body:
        if isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
            is_async = isinstance(node, ast.AsyncFunctionDef)
            
            # Parse docstring for structured data
            docstring = ast.get_docstring(node)
            parsed_doc = docstring_parser.parse(docstring)
            
            functions.append({
                'name': node.name,
                'isAsync': is_async,
                'decorators': [get_decorator_name(dec) for dec in node.decorator_list],
                'line': node.lineno,
                'docstring': docstring,
                'parsedDoc': parsed_doc,
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


def extract_types(tree: ast.Module) -> List[Dict[str, Any]]:
    """Extract type definitions (TypeAlias, TypedDict, Protocol, Enum, NewType).
    
    Detects:
    - Type aliases: UserId = str
    - TypedDict classes
    - Protocol classes
    - Enum classes
    - NewType declarations
    """
    types = []
    
    for node in tree.body:
        # Type alias assignments (PEP 613: TypeAlias = ...)
        if isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            # Check if annotation is TypeAlias
            if isinstance(node.annotation, ast.Name) and node.annotation.id == 'TypeAlias':
                types.append({
                    'name': node.target.id,
                    'category': 'TypeAlias',
                    'line': node.lineno,
                    'definition': ast.unparse(node.value) if node.value else None,
                    'docstring': None,
                })
        
        # Simple type alias: UserId = str (without TypeAlias annotation)
        elif isinstance(node, ast.Assign):
            if len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
                target_name = node.targets[0].id
                # Heuristic: if it looks like a type (uppercase start) and value is a type expression
                if target_name[0].isupper() and is_type_expression(node.value):
                    types.append({
                        'name': target_name,
                        'category': 'TypeAlias',
                        'line': node.lineno,
                        'definition': ast.unparse(node.value),
                        'docstring': None,
                    })
        
        # Class-based type definitions
        elif isinstance(node, ast.ClassDef):
            base_names = [get_name(base) for base in node.bases]
            
            # TypedDict
            if 'TypedDict' in base_names:
                types.append({
                    'name': node.name,
                    'category': 'TypedDict',
                    'line': node.lineno,
                    'definition': extract_typeddict_fields(node),
                    'docstring': ast.get_docstring(node),
                })
            
            # Protocol
            elif 'Protocol' in base_names or any('Protocol' in bn for bn in base_names):
                types.append({
                    'name': node.name,
                    'category': 'Protocol',
                    'line': node.lineno,
                    'definition': extract_protocol_methods(node),
                    'docstring': ast.get_docstring(node),
                })
            
            # Enum
            elif 'Enum' in base_names or 'IntEnum' in base_names or 'StrEnum' in base_names:
                types.append({
                    'name': node.name,
                    'category': 'Enum',
                    'line': node.lineno,
                    'definition': extract_enum_members(node),
                    'docstring': ast.get_docstring(node),
                })
        
        # NewType calls: UserId = NewType('UserId', str)
        elif isinstance(node, ast.Assign):
            if len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
                if isinstance(node.value, ast.Call):
                    if isinstance(node.value.func, ast.Name) and node.value.func.id == 'NewType':
                        types.append({
                            'name': node.targets[0].id,
                            'category': 'NewType',
                            'line': node.lineno,
                            'definition': ast.unparse(node.value),
                            'docstring': None,
                        })
    
    return types


def is_type_expression(node) -> bool:
    """Check if an AST node represents a type expression."""
    if isinstance(node, (ast.Name, ast.Constant)):
        return True
    if isinstance(node, ast.Subscript):  # List[str], Dict[str, int], etc.
        return True
    if isinstance(node, ast.BinOp) and isinstance(node.op, ast.BitOr):  # Union with |
        return True
    if isinstance(node, ast.Attribute):  # typing.Optional, etc.
        return True
    return False


def extract_typeddict_fields(class_node: ast.ClassDef) -> str:
    """Extract TypedDict field definitions."""
    fields = []
    for node in class_node.body:
        if isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            field_name = node.target.id
            field_type = get_annotation(node.annotation) if node.annotation else 'Any'
            fields.append(f"{field_name}: {field_type}")
    return "{" + ", ".join(fields) + "}"


def extract_protocol_methods(class_node: ast.ClassDef) -> str:
    """Extract Protocol method signatures."""
    methods = []
    for node in class_node.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            method_sig = f"{'async ' if isinstance(node, ast.AsyncFunctionDef) else ''}{node.name}("
            params = []
            for arg in node.args.args:
                if arg.arg != 'self':
                    param_str = arg.arg
                    if arg.annotation:
                        param_str += f": {get_annotation(arg.annotation)}"
                    params.append(param_str)
            method_sig += ", ".join(params) + ")"
            if node.returns:
                method_sig += f" -> {get_annotation(node.returns)}"
            methods.append(method_sig)
    return "{" + ", ".join(methods) + "}"


def extract_enum_members(class_node: ast.ClassDef) -> str:
    """Extract Enum member names."""
    members = []
    for node in class_node.body:
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    members.append(target.id)
    return "{" + ", ".join(members) + "}"


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
