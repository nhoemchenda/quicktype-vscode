import { PrimitiveTypeKind, Type, PrimitiveStringTypeKind, ClassProperty, MaybeTypeIdentity, TransformedStringTypeKind } from "./Type";
import { TypeGraph, TypeRef } from "./TypeGraph";
import { TypeAttributes, TypeAttributeKind } from "./attributes/TypeAttributes";
import { StringTypes } from "./attributes/StringTypes";
export declare const provenanceTypeAttributeKind: TypeAttributeKind<Set<number>>;
export declare type StringTypeMapping = ReadonlyMap<TransformedStringTypeKind, PrimitiveStringTypeKind>;
export declare function stringTypeMappingGet(stm: StringTypeMapping, kind: TransformedStringTypeKind): PrimitiveStringTypeKind;
export declare function getNoStringTypeMapping(): StringTypeMapping;
export declare class TypeBuilder {
    private readonly _stringTypeMapping;
    readonly canonicalOrder: boolean;
    private readonly _allPropertiesOptional;
    private readonly _addProvenanceAttributes;
    readonly typeGraph: TypeGraph;
    protected readonly topLevels: Map<string, TypeRef>;
    protected readonly types: (Type | undefined)[];
    private readonly typeAttributes;
    private _addedForwardingIntersection;
    constructor(typeGraphSerial: number, _stringTypeMapping: StringTypeMapping, canonicalOrder: boolean, _allPropertiesOptional: boolean, _addProvenanceAttributes: boolean, inheritsProvenanceAttributes: boolean);
    addTopLevel(name: string, tref: TypeRef): void;
    reserveTypeRef(): TypeRef;
    private assertTypeRefGraph;
    private assertTypeRefSetGraph;
    private filterTypeAttributes;
    private commitType;
    protected addType<T extends Type>(forwardingRef: TypeRef | undefined, creator: (tref: TypeRef) => T, attributes: TypeAttributes | undefined): TypeRef;
    typeAtIndex(index: number): Type;
    atIndex(index: number): [Type, TypeAttributes];
    addAttributes(tref: TypeRef, attributes: TypeAttributes): void;
    finish(): TypeGraph;
    protected addForwardingIntersection(forwardingRef: TypeRef, tref: TypeRef): TypeRef;
    protected forwardIfNecessary(forwardingRef: TypeRef | undefined, tref: undefined): undefined;
    protected forwardIfNecessary(forwardingRef: TypeRef | undefined, tref: TypeRef): TypeRef;
    protected forwardIfNecessary(forwardingRef: TypeRef | undefined, tref: TypeRef | undefined): TypeRef | undefined;
    readonly didAddForwardingIntersection: boolean;
    private readonly _typeForIdentity;
    private registerTypeForIdentity;
    protected makeIdentity(maker: () => MaybeTypeIdentity): MaybeTypeIdentity;
    private getOrAddType;
    private registerType;
    getPrimitiveType(kind: PrimitiveTypeKind, maybeAttributes?: TypeAttributes, forwardingRef?: TypeRef): TypeRef;
    getStringType(attributes: TypeAttributes, stringTypes: StringTypes | undefined, forwardingRef?: TypeRef): TypeRef;
    getEnumType(attributes: TypeAttributes, cases: ReadonlySet<string>, forwardingRef?: TypeRef): TypeRef;
    makeClassProperty(tref: TypeRef, isOptional: boolean): ClassProperty;
    getUniqueObjectType(attributes: TypeAttributes, properties: ReadonlyMap<string, ClassProperty> | undefined, additionalProperties: TypeRef | undefined, forwardingRef?: TypeRef): TypeRef;
    getUniqueMapType(forwardingRef?: TypeRef): TypeRef;
    getMapType(attributes: TypeAttributes, values: TypeRef, forwardingRef?: TypeRef): TypeRef;
    setObjectProperties(ref: TypeRef, properties: ReadonlyMap<string, ClassProperty>, additionalProperties: TypeRef | undefined): void;
    getUniqueArrayType(forwardingRef?: TypeRef): TypeRef;
    getArrayType(attributes: TypeAttributes, items: TypeRef, forwardingRef?: TypeRef): TypeRef;
    setArrayItems(ref: TypeRef, items: TypeRef): void;
    modifyPropertiesIfNecessary(properties: ReadonlyMap<string, ClassProperty>): ReadonlyMap<string, ClassProperty>;
    getClassType(attributes: TypeAttributes, properties: ReadonlyMap<string, ClassProperty>, forwardingRef?: TypeRef): TypeRef;
    getUniqueClassType(attributes: TypeAttributes, isFixed: boolean, properties: ReadonlyMap<string, ClassProperty> | undefined, forwardingRef?: TypeRef): TypeRef;
    getUnionType(attributes: TypeAttributes, members: ReadonlySet<TypeRef>, forwardingRef?: TypeRef): TypeRef;
    getUniqueUnionType(attributes: TypeAttributes, members: ReadonlySet<TypeRef> | undefined, forwardingRef?: TypeRef): TypeRef;
    getIntersectionType(attributes: TypeAttributes, members: ReadonlySet<TypeRef>, forwardingRef?: TypeRef): TypeRef;
    getUniqueIntersectionType(attributes: TypeAttributes, members: ReadonlySet<TypeRef> | undefined, forwardingRef?: TypeRef): TypeRef;
    setSetOperationMembers(ref: TypeRef, members: ReadonlySet<TypeRef>): void;
    setLostTypeAttributes(): void;
}