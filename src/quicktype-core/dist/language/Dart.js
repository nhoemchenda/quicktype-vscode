"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Type_1 = require("../Type");
const TypeUtils_1 = require("../TypeUtils");
const Source_1 = require("../Source");
const Strings_1 = require("../support/Strings");
const Naming_1 = require("../Naming");
const ConvenienceRenderer_1 = require("../ConvenienceRenderer");
const TargetLanguage_1 = require("../TargetLanguage");
const RendererOptions_1 = require("../RendererOptions");
const Annotation_1 = require("../Annotation");
const Support_1 = require("../support/Support");
const collection_utils_1 = require("collection-utils");
exports.dartOptions = {
    justTypes: new RendererOptions_1.BooleanOption("just-types", "Types only", false),
    codersInClass: new RendererOptions_1.BooleanOption("coders-in-class", "Put encoder & decoder in Class", false),
    methodNamesWithMap: new RendererOptions_1.BooleanOption("from-map", "Use method names fromMap() & toMap()", false),
    requiredProperties: new RendererOptions_1.BooleanOption("required-props", "Make all properties required", false),
    finalProperties: new RendererOptions_1.BooleanOption("final-props", "Make all properties final", false),
    generateCopyWith: new RendererOptions_1.BooleanOption("copy-with", "Generate CopyWith method", false),
};
class DartTargetLanguage extends TargetLanguage_1.TargetLanguage {
    constructor() {
        super("Dart", ["dart"], "dart");
    }
    getOptions() {
        return [
            exports.dartOptions.justTypes,
            exports.dartOptions.codersInClass,
            exports.dartOptions.methodNamesWithMap,
            exports.dartOptions.requiredProperties,
            exports.dartOptions.finalProperties,
            exports.dartOptions.generateCopyWith
        ];
    }
    get supportsUnionsWithBothNumberTypes() {
        return true;
    }
    get stringTypeMapping() {
        const mapping = new Map();
        mapping.set("date", "date");
        mapping.set("date-time", "date-time");
        //        mapping.set("uuid", "uuid");
        return mapping;
    }
    makeRenderer(renderContext, untypedOptionValues) {
        const options = RendererOptions_1.getOptionValues(exports.dartOptions, untypedOptionValues);
        return new DartRenderer(this, renderContext, options);
    }
}
exports.DartTargetLanguage = DartTargetLanguage;
const keywords = [
    "abstract",
    "do",
    "import",
    "super",
    "as",
    "dynamic",
    "in",
    "switch",
    "assert",
    "else",
    "interface",
    "sync*",
    "async",
    "enum",
    "is",
    "this",
    "async*",
    "export",
    "library",
    "throw",
    "await",
    "external",
    "mixin",
    "true",
    "break",
    "extends",
    "new",
    "try",
    "case",
    "factory",
    "null",
    "typedef",
    "catch",
    "false",
    "operator",
    "var",
    "class",
    "final",
    "part",
    "void",
    "const",
    "finally",
    "rethrow",
    "while",
    "continue",
    "for",
    "return",
    "with",
    "covariant",
    "get",
    "set",
    "yield",
    "default",
    "if",
    "static",
    "yield*",
    "deferred",
    "implements",
    "int",
    "double",
    "bool",
    "Map",
    "List",
    "String",
    "File",
    "fromJson",
    "toJson",
    "fromMap",
    "toMap"
];
const typeNamingFunction = Naming_1.funPrefixNamer("types", n => dartNameStyle(true, false, n));
const propertyNamingFunction = Naming_1.funPrefixNamer("properties", n => dartNameStyle(false, false, n));
const enumCaseNamingFunction = Naming_1.funPrefixNamer("enum-cases", n => dartNameStyle(true, true, n));
// Escape the dollar sign, which is used in string interpolation
const stringEscape = Strings_1.utf16ConcatMap(Strings_1.escapeNonPrintableMapper(cp => Strings_1.isPrintable(cp) && cp !== 0x24, Strings_1.standardUnicodeHexEscape));
function isStartCharacter(codePoint) {
    if (codePoint === 0x5f)
        return false; // underscore
    return Strings_1.isAscii(codePoint) && Strings_1.isLetter(codePoint);
}
function isPartCharacter(codePoint) {
    return isStartCharacter(codePoint) || (Strings_1.isAscii(codePoint) && Strings_1.isDigit(codePoint));
}
const legalizeName = Strings_1.utf16LegalizeCharacters(isPartCharacter);
// FIXME: Handle acronyms consistently.  In particular, that means that
// we have to use namers to produce the getter and setter names - we can't
// just capitalize and concatenate.
// https://stackoverflow.com/questions/8277355/naming-convention-for-upper-case-abbreviations
function dartNameStyle(startWithUpper, upperUnderscore, original) {
    const words = Strings_1.splitIntoWords(original);
    const firstWordStyle = upperUnderscore
        ? Strings_1.allUpperWordStyle
        : startWithUpper
            ? Strings_1.firstUpperWordStyle
            : Strings_1.allLowerWordStyle;
    const restWordStyle = upperUnderscore ? Strings_1.allUpperWordStyle : Strings_1.firstUpperWordStyle;
    return Strings_1.combineWords(words, legalizeName, firstWordStyle, restWordStyle, firstWordStyle, restWordStyle, upperUnderscore ? "_" : "", isStartCharacter);
}
class DartRenderer extends ConvenienceRenderer_1.ConvenienceRenderer {
    constructor(targetLanguage, renderContext, _options) {
        super(targetLanguage, renderContext);
        this._options = _options;
        this._gettersAndSettersForPropertyName = new Map();
        this._needEnumValues = false;
        this._topLevelDependents = new Map();
        this._enumValues = new Map();
    }
    forbiddenNamesForGlobalNamespace() {
        return keywords;
    }
    forbiddenForObjectProperties(_c, _className) {
        return { names: [], includeGlobalForbidden: true };
    }
    makeNamedTypeNamer() {
        return typeNamingFunction;
    }
    namerForObjectProperty() {
        return propertyNamingFunction;
    }
    makeUnionMemberNamer() {
        return propertyNamingFunction;
    }
    makeEnumCaseNamer() {
        return enumCaseNamingFunction;
    }
    unionNeedsName(u) {
        return TypeUtils_1.nullableFromUnion(u) === null;
    }
    namedTypeToNameForTopLevel(type) {
        // If the top-level type doesn't contain any classes or unions
        // we have to define a class just for the `FromJson` method, in
        // emitFromJsonForTopLevel.
        return TypeUtils_1.directlyReachableSingleNamedType(type);
    }
    makeTopLevelDependencyNames(_t, name) {
        const encoder = new Naming_1.DependencyName(propertyNamingFunction, name.order, lookup => `${lookup(name)}_to_json`);
        const decoder = new Naming_1.DependencyName(propertyNamingFunction, name.order, lookup => `${lookup(name)}_from_json`);
        this._topLevelDependents.set(name, { encoder, decoder });
        return [encoder, decoder];
    }
    makeNamesForPropertyGetterAndSetter(_c, _className, _p, _jsonName, name) {
        const getterName = new Naming_1.DependencyName(propertyNamingFunction, name.order, lookup => `get_${lookup(name)}`);
        const setterName = new Naming_1.DependencyName(propertyNamingFunction, name.order, lookup => `set_${lookup(name)}`);
        return [getterName, setterName];
    }
    makePropertyDependencyNames(c, className, p, jsonName, name) {
        const getterAndSetterNames = this.makeNamesForPropertyGetterAndSetter(c, className, p, jsonName, name);
        this._gettersAndSettersForPropertyName.set(name, getterAndSetterNames);
        return getterAndSetterNames;
    }
    makeNamedTypeDependencyNames(t, name) {
        if (!(t instanceof Type_1.EnumType))
            return [];
        const enumValue = new Naming_1.DependencyName(propertyNamingFunction, name.order, lookup => `${lookup(name)}_values`);
        this._enumValues.set(t, enumValue);
        return [enumValue];
    }
    emitFileHeader() {
        if (this.leadingComments !== undefined) {
            this.emitCommentLines(this.leadingComments);
        }
        if (this._options.justTypes)
            return;
        this.emitLine("// To parse this JSON data, do");
        this.emitLine("//");
        this.forEachTopLevel("none", (_t, name) => {
            const { decoder } = Support_1.defined(this._topLevelDependents.get(name));
            this.emitLine("//     final ", Source_1.modifySource(Strings_1.decapitalize, name), " = ", decoder, "(jsonString);");
        });
        this.ensureBlankLine();
        if (this._options.requiredProperties) {
            this.emitLine("import 'package:meta/meta.dart';");
        }
        this.emitLine("import 'dart:convert';");
    }
    emitDescriptionBlock(lines) {
        this.emitCommentLines(lines, " * ", "/**", " */");
    }
    emitBlock(line, f) {
        this.emitLine(line, " {");
        this.indent(f);
        this.emitLine("}");
    }
    dartType(t, withIssues = false) {
        return TypeUtils_1.matchType(t, _anyType => Source_1.maybeAnnotated(withIssues, Annotation_1.anyTypeIssueAnnotation, "dynamic"), _nullType => Source_1.maybeAnnotated(withIssues, Annotation_1.nullTypeIssueAnnotation, "dynamic"), _boolType => "bool", _integerType => "int", _doubleType => "double", _stringType => "String", arrayType => ["List<", this.dartType(arrayType.items, withIssues), ">"], classType => this.nameForNamedType(classType), mapType => ["Map<String, ", this.dartType(mapType.values, withIssues), ">"], enumType => this.nameForNamedType(enumType), unionType => {
            const maybeNullable = TypeUtils_1.nullableFromUnion(unionType);
            if (maybeNullable === null) {
                return "dynamic";
            }
            return this.dartType(maybeNullable, withIssues);
        }, transformedStringType => {
            switch (transformedStringType.kind) {
                case "date-time":
                case "date":
                    return "DateTime";
                default:
                    return "String";
            }
        });
    }
    mapList(itemType, list, mapper) {
        return ["List<", itemType, ">.from(", list, ".map((x) => ", mapper, "))"];
    }
    mapMap(valueType, map, valueMapper) {
        return ["Map.from(", map, ").map((k, v) => MapEntry<String, ", valueType, ">(k, ", valueMapper, "))"];
    }
    fromDynamicExpression(t, ...dynamic) {
        return TypeUtils_1.matchType(t, _anyType => dynamic, _nullType => dynamic, // FIXME: check null
        // FIXME: check null
        _boolType => dynamic, _integerType => dynamic, _doubleType => [dynamic, ".toDouble()"], _stringType => dynamic, arrayType => this.mapList(this.dartType(arrayType.items), dynamic, this.fromDynamicExpression(arrayType.items, "x")), classType => [
            this.nameForNamedType(classType),
            ".from",
            this._options.methodNamesWithMap ? "Map" : "Json",
            "(",
            dynamic,
            ")"
        ], mapType => this.mapMap(this.dartType(mapType.values), dynamic, this.fromDynamicExpression(mapType.values, "v")), enumType => [Support_1.defined(this._enumValues.get(enumType)), ".map[", dynamic, "]"], unionType => {
            const maybeNullable = TypeUtils_1.nullableFromUnion(unionType);
            if (maybeNullable === null) {
                return dynamic;
            }
            return [dynamic, " == null ? null : ", this.fromDynamicExpression(maybeNullable, dynamic)];
        }, transformedStringType => {
            switch (transformedStringType.kind) {
                case "date-time":
                case "date":
                    return ["DateTime.parse(", dynamic, ")"];
                default:
                    return dynamic;
            }
        });
    }
    toDynamicExpression(t, ...dynamic) {
        return TypeUtils_1.matchType(t, _anyType => dynamic, _nullType => dynamic, _boolType => dynamic, _integerType => dynamic, _doubleType => dynamic, _stringType => dynamic, arrayType => this.mapList("dynamic", dynamic, this.toDynamicExpression(arrayType.items, "x")), _classType => [dynamic, ".to", this._options.methodNamesWithMap ? "Map" : "Json", "()"], mapType => this.mapMap("dynamic", dynamic, this.toDynamicExpression(mapType.values, "v")), enumType => [Support_1.defined(this._enumValues.get(enumType)), ".reverse[", dynamic, "]"], unionType => {
            const maybeNullable = TypeUtils_1.nullableFromUnion(unionType);
            if (maybeNullable === null) {
                return dynamic;
            }
            return [dynamic, " == null ? null : ", this.toDynamicExpression(maybeNullable, dynamic)];
        }, transformedStringType => {
            switch (transformedStringType.kind) {
                case "date-time":
                    return [dynamic, ".toIso8601String()"];
                case "date":
                    return [
                        '"${',
                        dynamic,
                        ".year.toString().padLeft(4, '0')",
                        "}-${",
                        dynamic,
                        ".month.toString().padLeft(2, '0')}-${",
                        dynamic,
                        ".day.toString().padLeft(2, '0')}\""
                    ];
                default:
                    return dynamic;
            }
        });
    }
    emitClassDefinition(c, className) {
        this.emitDescription(this.descriptionForType(c));
        this.emitBlock(["class ", className], () => {
            if (c.getProperties().size === 0) {
                this.emitLine(className, "();");
            }
            else {
                this.forEachClassProperty(c, "none", (name, _, p) => {
                    this.emitLine(this._options.finalProperties ? "final " : "", this.dartType(p.type, true), " ", name, ";");
                });
                this.ensureBlankLine();
                this.emitLine(className, "({");
                this.indent(() => {
                    this.forEachClassProperty(c, "none", (name, _, _p) => {
                        this.emitLine(this._options.requiredProperties ? "@required " : "", "this.", name, ",");
                    });
                });
                this.emitLine("});");
            }
            if (this._options.generateCopyWith) {
                this.ensureBlankLine();
                this.emitLine(className, " copyWith({");
                this.indent(() => {
                    this.forEachClassProperty(c, "none", (name, _, _p) => {
                        this.emitLine(this.dartType(_p.type, true), " ", name, ",");
                    });
                });
                this.emitLine("}) => ");
                this.indent(() => {
                    this.emitLine(className, "(");
                    this.indent(() => {
                        this.forEachClassProperty(c, "none", (name, _, _p) => {
                            this.emitLine(name, ": ", name, " ?? ", "this.", name, ",");
                        });
                    });
                    this.emitLine(");");
                });
            }
            if (this._options.justTypes)
                return;
            if (this._options.codersInClass) {
                this.ensureBlankLine();
                this.emitLine("factory ", className, ".from", this._options.methodNamesWithMap ? "Json" : "RawJson", "(String str) => ", className, ".from", this._options.methodNamesWithMap ? "Map" : "Json", "(json.decode(str));");
                this.ensureBlankLine();
                this.emitLine("String ", this._options.methodNamesWithMap ? "toJson() => " : "toRawJson() => ", "json.encode(", this._options.methodNamesWithMap ? "toMap" : "toJson", "());");
            }
            this.ensureBlankLine();
            this.emitLine("factory ", className, ".from", this._options.methodNamesWithMap ? "Map" : "Json", "(Map<String, dynamic> json) => ", className, "(");
            this.indent(() => {
                this.forEachClassProperty(c, "none", (name, jsonName, property) => {
                    this.emitLine(name, ": ", this.fromDynamicExpression(property.type, 'json["', stringEscape(jsonName), '"]'), ",");
                });
            });
            this.emitLine(");");
            this.ensureBlankLine();
            this.emitLine("Map<String, dynamic> to", this._options.methodNamesWithMap ? "Map" : "Json", "() => {");
            this.indent(() => {
                this.forEachClassProperty(c, "none", (name, jsonName, property) => {
                    this.emitLine('"', stringEscape(jsonName), '": ', this.toDynamicExpression(property.type, name), ",");
                });
            });
            this.emitLine("};");
        });
    }
    emitEnumDefinition(e, enumName) {
        const caseNames = Array.from(e.cases).map(c => this.nameForEnumCase(e, c));
        this.emitDescription(this.descriptionForType(e));
        this.emitLine("enum ", enumName, " { ", collection_utils_1.arrayIntercalate(", ", caseNames), " }");
        if (this._options.justTypes)
            return;
        this.ensureBlankLine();
        this.emitLine("final ", Support_1.defined(this._enumValues.get(e)), " = EnumValues({");
        this.indent(() => {
            this.forEachEnumCase(e, "none", (name, jsonName, pos) => {
                const comma = pos === "first" || pos === "middle" ? "," : [];
                this.emitLine('"', stringEscape(jsonName), '": ', enumName, ".", name, comma);
            });
        });
        this.emitLine("});");
        this._needEnumValues = true;
    }
    emitEnumValues() {
        this.ensureBlankLine();
        this.emitMultiline(`class EnumValues<T> {
    Map<String, T> map;
    Map<T, String> reverseMap;

    EnumValues(this.map);

    Map<T, String> get reverse {
        if (reverseMap == null) {
            reverseMap = map.map((k, v) => new MapEntry(v, k));
        }
        return reverseMap;
    }
}`);
    }
    emitSourceStructure() {
        this.emitFileHeader();
        if (!this._options.justTypes && !this._options.codersInClass) {
            this.forEachTopLevel("leading-and-interposing", (t, name) => {
                const { encoder, decoder } = Support_1.defined(this._topLevelDependents.get(name));
                this.emitLine(this.dartType(t), " ", decoder, "(String str) => ", this.fromDynamicExpression(t, "json.decode(str)"), ";");
                this.ensureBlankLine();
                this.emitLine("String ", encoder, "(", this.dartType(t), " data) => json.encode(", this.toDynamicExpression(t, "data"), ");");
                // this.emitBlock(["String ", encoder, "(", this.dartType(t), " data)"], () => {
                //     this.emitJsonEncoderBlock(t);
                // });
            });
        }
        this.forEachNamedType("leading-and-interposing", (c, n) => this.emitClassDefinition(c, n), (e, n) => this.emitEnumDefinition(e, n), (_e, _n) => {
            // We don't support this yet.
        });
        if (this._needEnumValues) {
            this.emitEnumValues();
        }
    }
}
exports.DartRenderer = DartRenderer;
