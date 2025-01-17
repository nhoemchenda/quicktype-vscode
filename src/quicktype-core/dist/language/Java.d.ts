import { ConvenienceRenderer, ForbiddenWordsInfo } from "../ConvenienceRenderer";
import { Name, Namer } from "../Naming";
import { RenderContext } from "../Renderer";
import { BooleanOption, EnumOption, Option, OptionValues, StringOption } from "../RendererOptions";
import { Sourcelike } from "../Source";
import { AcronymStyleOptions } from "../support/Acronyms";
import { TargetLanguage } from "../TargetLanguage";
import { ClassProperty, ClassType, EnumType, Type, UnionType } from "../Type";
export declare const javaOptions: {
    useList: EnumOption<boolean>;
    justTypes: BooleanOption;
    acronymStyle: EnumOption<AcronymStyleOptions>;
    packageName: StringOption;
};
export declare class JavaTargetLanguage extends TargetLanguage {
    constructor();
    protected getOptions(): Option<any>[];
    readonly supportsUnionsWithBothNumberTypes: boolean;
    protected makeRenderer(renderContext: RenderContext, untypedOptionValues: {
        [name: string]: any;
    }): JavaRenderer;
}
export declare const stringEscape: (s: string) => string;
export declare function javaNameStyle(startWithUpper: boolean, upperUnderscore: boolean, original: string, acronymsStyle?: (s: string) => string): string;
export declare class JavaRenderer extends ConvenienceRenderer {
    private readonly _options;
    private _currentFilename;
    private readonly _gettersAndSettersForPropertyName;
    private _haveEmittedLeadingComments;
    constructor(targetLanguage: TargetLanguage, renderContext: RenderContext, _options: OptionValues<typeof javaOptions>);
    protected forbiddenNamesForGlobalNamespace(): string[];
    protected forbiddenForObjectProperties(_c: ClassType, _className: Name): ForbiddenWordsInfo;
    protected makeNamedTypeNamer(): Namer;
    protected namerForObjectProperty(): Namer;
    protected makeUnionMemberNamer(): Namer;
    protected makeEnumCaseNamer(): Namer;
    protected unionNeedsName(u: UnionType): boolean;
    protected namedTypeToNameForTopLevel(type: Type): Type | undefined;
    protected makeNamesForPropertyGetterAndSetter(_c: ClassType, _className: Name, _p: ClassProperty, _jsonName: string, name: Name): [Name, Name];
    protected makePropertyDependencyNames(c: ClassType, className: Name, p: ClassProperty, jsonName: string, name: Name): Name[];
    private getNameStyling;
    private fieldOrMethodName;
    private methodName;
    private decoderName;
    private encoderName;
    private readerGetterName;
    private writerGetterName;
    protected startFile(basename: Sourcelike): void;
    protected finishFile(): void;
    protected emitPackageAndImports(imports: string[]): void;
    protected emitFileHeader(fileName: Sourcelike, imports: string[]): void;
    protected emitDescriptionBlock(lines: Sourcelike[]): void;
    protected emitBlock(line: Sourcelike, f: () => void): void;
    protected javaType(reference: boolean, t: Type, withIssues?: boolean): Sourcelike;
    protected javaTypeWithoutGenerics(reference: boolean, t: Type): Sourcelike;
    protected emitClassAttributes(c: ClassType, _className: Name): void;
    protected emitAccessorAttributes(_c: ClassType, _className: Name, _propertyName: Name, jsonName: string, _p: ClassProperty, _isSetter: boolean): void;
    protected importsForType(t: ClassType | UnionType | EnumType): string[];
    protected emitClassDefinition(c: ClassType, className: Name): void;
    protected unionField(u: UnionType, t: Type, withIssues?: boolean): {
        fieldType: Sourcelike;
        fieldName: Sourcelike;
    };
    protected emitUnionDefinition(u: UnionType, unionName: Name): void;
    protected emitEnumDefinition(e: EnumType, enumName: Name): void;
    protected emitConverterClass(): void;
    protected emitSourceStructure(): void;
}
