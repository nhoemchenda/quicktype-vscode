"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Annotation_1 = require("../Annotation");
const ConvenienceRenderer_1 = require("../ConvenienceRenderer");
const Naming_1 = require("../Naming");
const RendererOptions_1 = require("../RendererOptions");
const Source_1 = require("../Source");
const Acronyms_1 = require("../support/Acronyms");
const Strings_1 = require("../support/Strings");
const Support_1 = require("../support/Support");
const TargetLanguage_1 = require("../TargetLanguage");
const Type_1 = require("../Type");
const TypeUtils_1 = require("../TypeUtils");
exports.javaOptions = {
    useList: new RendererOptions_1.EnumOption("array-type", "Use T[] or List<T>", [["array", false], ["list", true]], "array"),
    justTypes: new RendererOptions_1.BooleanOption("just-types", "Plain types only", false),
    acronymStyle: Acronyms_1.acronymOption(Acronyms_1.AcronymStyleOptions.Pascal),
    // FIXME: Do this via a configurable named eventually.
    packageName: new RendererOptions_1.StringOption("package", "Generated package name", "NAME", "io.quicktype")
};
class JavaTargetLanguage extends TargetLanguage_1.TargetLanguage {
    constructor() {
        super("Java", ["java"], "java");
    }
    getOptions() {
        return [exports.javaOptions.packageName, exports.javaOptions.justTypes, exports.javaOptions.acronymStyle, exports.javaOptions.useList];
    }
    get supportsUnionsWithBothNumberTypes() {
        return true;
    }
    makeRenderer(renderContext, untypedOptionValues) {
        return new JavaRenderer(this, renderContext, RendererOptions_1.getOptionValues(exports.javaOptions, untypedOptionValues));
    }
}
exports.JavaTargetLanguage = JavaTargetLanguage;
const keywords = [
    "Object",
    "Class",
    "System",
    "Long",
    "Double",
    "Boolean",
    "String",
    "Map",
    "Exception",
    "IOException",
    "JsonProperty",
    "JsonDeserialize",
    "JsonDeserializer",
    "JsonSerialize",
    "JsonSerializer",
    "JsonParser",
    "JsonProcessingException",
    "DeserializationContext",
    "SerializerProvider",
    "Converter",
    "Override",
    "abstract",
    "continue",
    "for",
    "new",
    "switch",
    "assert",
    "default",
    "goto",
    "package",
    "synchronized",
    "boolean",
    "do",
    "if",
    "private",
    "this",
    "break",
    "double",
    "implements",
    "protected",
    "throw",
    "byte",
    "else",
    "import",
    "public",
    "throws",
    "case",
    "enum",
    "instanceof",
    "return",
    "transient",
    "catch",
    "extends",
    "int",
    "short",
    "try",
    "char",
    "final",
    "interface",
    "static",
    "void",
    "class",
    "finally",
    "long",
    "strictfp",
    "volatile",
    "const",
    "float",
    "native",
    "super",
    "while",
    "null",
    "false",
    "true"
];
exports.stringEscape = Strings_1.utf16ConcatMap(Strings_1.escapeNonPrintableMapper(Strings_1.isAscii, Strings_1.standardUnicodeHexEscape));
function isStartCharacter(codePoint) {
    if (codePoint === 0x5f)
        return true; // underscore
    return Strings_1.isAscii(codePoint) && Strings_1.isLetter(codePoint);
}
function isPartCharacter(codePoint) {
    return isStartCharacter(codePoint) || (Strings_1.isAscii(codePoint) && Strings_1.isDigit(codePoint));
}
const legalizeName = Strings_1.utf16LegalizeCharacters(isPartCharacter);
function javaNameStyle(startWithUpper, upperUnderscore, original, acronymsStyle = Strings_1.allUpperWordStyle) {
    const words = Strings_1.splitIntoWords(original);
    return Strings_1.combineWords(words, legalizeName, upperUnderscore ? Strings_1.allUpperWordStyle : startWithUpper ? Strings_1.firstUpperWordStyle : Strings_1.allLowerWordStyle, upperUnderscore ? Strings_1.allUpperWordStyle : Strings_1.firstUpperWordStyle, upperUnderscore || startWithUpper ? Strings_1.allUpperWordStyle : Strings_1.allLowerWordStyle, acronymsStyle, upperUnderscore ? "_" : "", isStartCharacter);
}
exports.javaNameStyle = javaNameStyle;
class JavaRenderer extends ConvenienceRenderer_1.ConvenienceRenderer {
    constructor(targetLanguage, renderContext, _options) {
        super(targetLanguage, renderContext);
        this._options = _options;
        this._gettersAndSettersForPropertyName = new Map();
        this._haveEmittedLeadingComments = false;
    }
    forbiddenNamesForGlobalNamespace() {
        return keywords;
    }
    forbiddenForObjectProperties(_c, _className) {
        return { names: [], includeGlobalForbidden: true };
    }
    makeNamedTypeNamer() {
        return this.getNameStyling("typeNamingFunction");
    }
    namerForObjectProperty() {
        return this.getNameStyling("propertyNamingFunction");
    }
    makeUnionMemberNamer() {
        return this.getNameStyling("propertyNamingFunction");
    }
    makeEnumCaseNamer() {
        return this.getNameStyling("enumCaseNamingFunction");
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
    makeNamesForPropertyGetterAndSetter(_c, _className, _p, _jsonName, name) {
        const getterName = new Naming_1.DependencyName(this.getNameStyling("propertyNamingFunction"), name.order, lookup => `get_${lookup(name)}`);
        const setterName = new Naming_1.DependencyName(this.getNameStyling("propertyNamingFunction"), name.order, lookup => `set_${lookup(name)}`);
        return [getterName, setterName];
    }
    makePropertyDependencyNames(c, className, p, jsonName, name) {
        const getterAndSetterNames = this.makeNamesForPropertyGetterAndSetter(c, className, p, jsonName, name);
        this._gettersAndSettersForPropertyName.set(name, getterAndSetterNames);
        return getterAndSetterNames;
    }
    getNameStyling(convention) {
        const styling = {
            typeNamingFunction: Naming_1.funPrefixNamer("types", n => javaNameStyle(true, false, n, Acronyms_1.acronymStyle(this._options.acronymStyle))),
            propertyNamingFunction: Naming_1.funPrefixNamer("properties", n => javaNameStyle(false, false, n, Acronyms_1.acronymStyle(this._options.acronymStyle))),
            enumCaseNamingFunction: Naming_1.funPrefixNamer("enum-cases", n => javaNameStyle(true, true, n, Acronyms_1.acronymStyle(this._options.acronymStyle)))
        };
        return styling[convention];
    }
    fieldOrMethodName(methodName, topLevelName) {
        if (this.topLevels.size === 1) {
            return methodName;
        }
        return [topLevelName, Strings_1.capitalize(methodName)];
    }
    methodName(prefix, suffix, topLevelName) {
        if (this.topLevels.size === 1) {
            return [prefix, suffix];
        }
        return [prefix, topLevelName, suffix];
    }
    decoderName(topLevelName) {
        return this.fieldOrMethodName("fromJsonString", topLevelName);
    }
    encoderName(topLevelName) {
        return this.fieldOrMethodName("toJsonString", topLevelName);
    }
    readerGetterName(topLevelName) {
        return this.methodName("get", "ObjectReader", topLevelName);
    }
    writerGetterName(topLevelName) {
        return this.methodName("get", "ObjectWriter", topLevelName);
    }
    startFile(basename) {
        Support_1.assert(this._currentFilename === undefined, "Previous file wasn't finished");
        // FIXME: The filenames should actually be Sourcelikes, too
        this._currentFilename = `${this.sourcelikeToString(basename)}.java`;
        // FIXME: Why is this necessary?
        this.ensureBlankLine();
        if (!this._haveEmittedLeadingComments && this.leadingComments !== undefined) {
            this.emitCommentLines(this.leadingComments);
            this.ensureBlankLine();
            this._haveEmittedLeadingComments = true;
        }
    }
    finishFile() {
        super.finishFile(Support_1.defined(this._currentFilename));
        this._currentFilename = undefined;
    }
    emitPackageAndImports(imports) {
        const allImports = ["java.util.*"].concat(imports);
        this.emitLine("package ", this._options.packageName, ";");
        this.ensureBlankLine();
        for (const pkg of allImports) {
            this.emitLine("import ", pkg, ";");
        }
    }
    emitFileHeader(fileName, imports) {
        this.startFile(fileName);
        this.emitPackageAndImports(imports);
        this.ensureBlankLine();
    }
    emitDescriptionBlock(lines) {
        this.emitCommentLines(lines, " * ", "/**", " */");
    }
    emitBlock(line, f) {
        this.emitLine(line, " {");
        this.indent(f);
        this.emitLine("}");
    }
    javaType(reference, t, withIssues = false) {
        return TypeUtils_1.matchType(t, _anyType => Source_1.maybeAnnotated(withIssues, Annotation_1.anyTypeIssueAnnotation, "Object"), _nullType => Source_1.maybeAnnotated(withIssues, Annotation_1.nullTypeIssueAnnotation, "Object"), _boolType => (reference ? "Boolean" : "boolean"), _integerType => (reference ? "Long" : "long"), _doubleType => (reference ? "Double" : "double"), _stringType => "String", arrayType => {
            if (this._options.useList) {
                return ["List<", this.javaType(true, arrayType.items, withIssues), ">"];
            }
            else {
                return [this.javaType(false, arrayType.items, withIssues), "[]"];
            }
        }, classType => this.nameForNamedType(classType), mapType => ["Map<String, ", this.javaType(true, mapType.values, withIssues), ">"], enumType => this.nameForNamedType(enumType), unionType => {
            const nullable = TypeUtils_1.nullableFromUnion(unionType);
            if (nullable !== null)
                return this.javaType(true, nullable, withIssues);
            return this.nameForNamedType(unionType);
        });
    }
    javaTypeWithoutGenerics(reference, t) {
        if (t instanceof Type_1.ArrayType) {
            if (this._options.useList) {
                return ["List<", this.javaTypeWithoutGenerics(true, t.items), ">"];
            }
            else {
                return [this.javaTypeWithoutGenerics(false, t.items), "[]"];
            }
        }
        else if (t instanceof Type_1.MapType) {
            return "Map";
        }
        else if (t instanceof Type_1.UnionType) {
            const nullable = TypeUtils_1.nullableFromUnion(t);
            if (nullable !== null)
                return this.javaTypeWithoutGenerics(true, nullable);
            return this.nameForNamedType(t);
        }
        else {
            return this.javaType(reference, t);
        }
    }
    emitClassAttributes(c, _className) {
        if (c.getProperties().size === 0 && !this._options.justTypes) {
            this.emitLine("@JsonAutoDetect(fieldVisibility=JsonAutoDetect.Visibility.NONE)");
        }
    }
    emitAccessorAttributes(_c, _className, _propertyName, jsonName, _p, _isSetter) {
        if (!this._options.justTypes) {
            this.emitLine('@JsonProperty("', exports.stringEscape(jsonName), '")');
        }
    }
    importsForType(t) {
        if (t instanceof Type_1.ClassType) {
            return this._options.justTypes ? [] : ["com.fasterxml.jackson.annotation.*"];
        }
        if (t instanceof Type_1.UnionType) {
            if (this._options.justTypes) {
                return ["java.io.IOException"];
            }
            return ["java.io.IOException", "com.fasterxml.jackson.core.*"]
                .concat(this._options.useList ? ["com.fasterxml.jackson.core.type.*"] : [])
                .concat(["com.fasterxml.jackson.databind.*", "com.fasterxml.jackson.databind.annotation.*"]);
        }
        if (t instanceof Type_1.EnumType) {
            if (this._options.justTypes) {
                return ["java.io.IOException"];
            }
            else {
                return ["java.io.IOException", "com.fasterxml.jackson.annotation.*"];
            }
        }
        return Support_1.assertNever(t);
    }
    emitClassDefinition(c, className) {
        this.emitFileHeader(className, this.importsForType(c));
        this.emitDescription(this.descriptionForType(c));
        this.emitClassAttributes(c, className);
        this.emitBlock(["public class ", className], () => {
            this.forEachClassProperty(c, "none", (name, _, p) => {
                this.emitLine("private ", this.javaType(false, p.type, true), " ", name, ";");
            });
            this.forEachClassProperty(c, "leading-and-interposing", (name, jsonName, p) => {
                this.emitDescription(this.descriptionForClassProperty(c, jsonName));
                const [getterName, setterName] = Support_1.defined(this._gettersAndSettersForPropertyName.get(name));
                this.emitAccessorAttributes(c, className, name, jsonName, p, false);
                const rendered = this.javaType(false, p.type);
                this.emitLine("public ", rendered, " ", getterName, "() { return ", name, "; }");
                this.emitAccessorAttributes(c, className, name, jsonName, p, true);
                this.emitLine("public void ", setterName, "(", rendered, " value) { this.", name, " = value; }");
            });
        });
        this.finishFile();
    }
    unionField(u, t, withIssues = false) {
        const fieldType = this.javaType(true, t, withIssues);
        // FIXME: "Value" should be part of the name.
        const fieldName = [this.nameForUnionMember(u, t), "Value"];
        return { fieldType, fieldName };
    }
    emitUnionDefinition(u, unionName) {
        const tokenCase = (tokenType) => {
            this.emitLine("case ", tokenType, ":");
        };
        const emitNullDeserializer = () => {
            tokenCase("VALUE_NULL");
            this.indent(() => this.emitLine("break;"));
        };
        const emitDeserializeType = (t) => {
            const { fieldName } = this.unionField(u, t);
            const rendered = this.javaTypeWithoutGenerics(true, t);
            if (this._options.useList && t instanceof Type_1.ArrayType) {
                this.emitLine("value.", fieldName, " = jsonParser.readValueAs(new TypeReference<", rendered, ">() {});");
            }
            else {
                this.emitLine("value.", fieldName, " = jsonParser.readValueAs(", rendered, ".class);");
            }
            this.emitLine("break;");
        };
        const emitDeserializer = (tokenTypes, kind) => {
            const t = u.findMember(kind);
            if (t === undefined)
                return;
            for (const tokenType of tokenTypes) {
                tokenCase(tokenType);
            }
            this.indent(() => emitDeserializeType(t));
        };
        const emitDoubleSerializer = () => {
            const t = u.findMember("double");
            if (t === undefined)
                return;
            if (u.findMember("integer") === undefined)
                tokenCase("VALUE_NUMBER_INT");
            tokenCase("VALUE_NUMBER_FLOAT");
            this.indent(() => emitDeserializeType(t));
        };
        this.emitFileHeader(unionName, this.importsForType(u));
        this.emitDescription(this.descriptionForType(u));
        if (!this._options.justTypes) {
            this.emitLine("@JsonDeserialize(using = ", unionName, ".Deserializer.class)");
            this.emitLine("@JsonSerialize(using = ", unionName, ".Serializer.class)");
        }
        const [maybeNull, nonNulls] = TypeUtils_1.removeNullFromUnion(u);
        this.emitBlock(["public class ", unionName], () => {
            for (const t of nonNulls) {
                const { fieldType, fieldName } = this.unionField(u, t, true);
                this.emitLine("public ", fieldType, " ", fieldName, ";");
            }
            if (this._options.justTypes)
                return;
            this.ensureBlankLine();
            this.emitBlock(["static class Deserializer extends JsonDeserializer<", unionName, ">"], () => {
                this.emitLine("@Override");
                this.emitBlock([
                    "public ",
                    unionName,
                    " deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException, JsonProcessingException"
                ], () => {
                    this.emitLine(unionName, " value = new ", unionName, "();");
                    this.emitLine("switch (jsonParser.getCurrentToken()) {");
                    if (maybeNull !== null)
                        emitNullDeserializer();
                    emitDeserializer(["VALUE_NUMBER_INT"], "integer");
                    emitDoubleSerializer();
                    emitDeserializer(["VALUE_TRUE", "VALUE_FALSE"], "bool");
                    emitDeserializer(["VALUE_STRING"], "string");
                    emitDeserializer(["START_ARRAY"], "array");
                    emitDeserializer(["START_OBJECT"], "class");
                    emitDeserializer(["VALUE_STRING"], "enum");
                    emitDeserializer(["START_OBJECT"], "map");
                    this.emitLine('default: throw new IOException("Cannot deserialize ', unionName, '");');
                    this.emitLine("}");
                    this.emitLine("return value;");
                });
            });
            this.ensureBlankLine();
            this.emitBlock(["static class Serializer extends JsonSerializer<", unionName, ">"], () => {
                this.emitLine("@Override");
                this.emitBlock([
                    "public void serialize(",
                    unionName,
                    " obj, JsonGenerator jsonGenerator, SerializerProvider serializerProvider) throws IOException"
                ], () => {
                    for (const t of nonNulls) {
                        const { fieldName } = this.unionField(u, t, true);
                        this.emitBlock(["if (obj.", fieldName, " != null)"], () => {
                            this.emitLine("jsonGenerator.writeObject(obj.", fieldName, ");");
                            this.emitLine("return;");
                        });
                    }
                    if (maybeNull !== null) {
                        this.emitLine("jsonGenerator.writeNull();");
                    }
                    else {
                        this.emitLine('throw new IOException("', unionName, ' must not be null");');
                    }
                });
            });
        });
        this.finishFile();
    }
    emitEnumDefinition(e, enumName) {
        this.emitFileHeader(enumName, this.importsForType(e));
        this.emitDescription(this.descriptionForType(e));
        const caseNames = [];
        this.forEachEnumCase(e, "none", name => {
            if (caseNames.length > 0)
                caseNames.push(", ");
            caseNames.push(name);
        });
        caseNames.push(";");
        this.emitBlock(["public enum ", enumName], () => {
            this.emitLine(caseNames);
            this.ensureBlankLine();
            if (!this._options.justTypes) {
                this.emitLine("@JsonValue");
            }
            this.emitBlock("public String toValue()", () => {
                this.emitLine("switch (this) {");
                this.forEachEnumCase(e, "none", (name, jsonName) => {
                    this.emitLine("case ", name, ': return "', exports.stringEscape(jsonName), '";');
                });
                this.emitLine("}");
                this.emitLine("return null;");
            });
            this.ensureBlankLine();
            if (!this._options.justTypes) {
                this.emitLine("@JsonCreator");
            }
            this.emitBlock(["public static ", enumName, " forValue(String value) throws IOException"], () => {
                this.forEachEnumCase(e, "none", (name, jsonName) => {
                    this.emitLine('if (value.equals("', exports.stringEscape(jsonName), '")) return ', name, ";");
                });
                this.emitLine('throw new IOException("Cannot deserialize ', enumName, '");');
            });
        });
        this.finishFile();
    }
    emitConverterClass() {
        this.startFile("Converter");
        this.emitCommentLines([
            "To use this code, add the following Maven dependency to your project:",
            "",
            "    com.fasterxml.jackson.core : jackson-databind : 2.9.0",
            "",
            "Import this package:",
            ""
        ]);
        this.emitLine("//     import ", this._options.packageName, ".Converter;");
        this.emitMultiline(`//
// Then you can deserialize a JSON string with
//`);
        this.forEachTopLevel("none", (t, name) => {
            this.emitLine("//     ", this.javaType(false, t), " data = Converter.", this.decoderName(name), "(jsonString);");
        });
        this.ensureBlankLine();
        this.emitPackageAndImports([
            "java.io.IOException",
            "com.fasterxml.jackson.databind.*",
            "com.fasterxml.jackson.core.JsonProcessingException"
        ]);
        this.ensureBlankLine();
        this.emitBlock(["public class Converter"], () => {
            this.emitLine("// Serialize/deserialize helpers");
            this.forEachTopLevel("leading-and-interposing", (topLevelType, topLevelName) => {
                const topLevelTypeRendered = this.javaType(false, topLevelType);
                this.emitBlock([
                    "public static ",
                    topLevelTypeRendered,
                    " ",
                    this.decoderName(topLevelName),
                    "(String json) throws IOException"
                ], () => {
                    this.emitLine("return ", this.readerGetterName(topLevelName), "().readValue(json);");
                });
                this.ensureBlankLine();
                this.emitBlock([
                    "public static String ",
                    this.encoderName(topLevelName),
                    "(",
                    topLevelTypeRendered,
                    " obj) throws JsonProcessingException"
                ], () => {
                    this.emitLine("return ", this.writerGetterName(topLevelName), "().writeValueAsString(obj);");
                });
            });
            this.forEachTopLevel("leading-and-interposing", (topLevelType, topLevelName) => {
                const readerName = this.fieldOrMethodName("reader", topLevelName);
                const writerName = this.fieldOrMethodName("writer", topLevelName);
                this.emitLine("private static ObjectReader ", readerName, ";");
                this.emitLine("private static ObjectWriter ", writerName, ";");
                this.ensureBlankLine();
                this.emitBlock(["private static void ", this.methodName("instantiate", "Mapper", topLevelName), "()"], () => {
                    const renderedForClass = this.javaTypeWithoutGenerics(false, topLevelType);
                    this.emitLine("ObjectMapper mapper = new ObjectMapper();");
                    this.emitLine(readerName, " = mapper.reader(", renderedForClass, ".class);");
                    this.emitLine(writerName, " = mapper.writerFor(", renderedForClass, ".class);");
                });
                this.ensureBlankLine();
                this.emitBlock(["private static ObjectReader ", this.readerGetterName(topLevelName), "()"], () => {
                    this.emitLine("if (", readerName, " == null) ", this.methodName("instantiate", "Mapper", topLevelName), "();");
                    this.emitLine("return ", readerName, ";");
                });
                this.ensureBlankLine();
                this.emitBlock(["private static ObjectWriter ", this.writerGetterName(topLevelName), "()"], () => {
                    this.emitLine("if (", writerName, " == null) ", this.methodName("instantiate", "Mapper", topLevelName), "();");
                    this.emitLine("return ", writerName, ";");
                });
            });
        });
        this.finishFile();
    }
    emitSourceStructure() {
        if (!this._options.justTypes) {
            this.emitConverterClass();
        }
        this.forEachNamedType("leading-and-interposing", (c, n) => this.emitClassDefinition(c, n), (e, n) => this.emitEnumDefinition(e, n), (u, n) => this.emitUnionDefinition(u, n));
    }
}
exports.JavaRenderer = JavaRenderer;
