declare const _default: (typesEnumName: any) => ({
    kind: string;
    name: {
        kind: string;
        value: string;
    };
    type: {
        kind: string;
        type: {
            kind: string;
            type: {
                kind: string;
                name: {
                    kind: string;
                    value: any;
                };
            };
        };
    };
    defaultValue: any;
    directives: any[];
} | {
    kind: string;
    name: {
        kind: string;
        value: string;
    };
    type: {
        kind: string;
        name: {
            kind: string;
            value: string;
        };
    };
    defaultValue: any;
    directives: any[];
})[];
export default _default;