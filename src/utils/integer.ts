import JSONbig from 'json-bigint';

const fixPrototype = (obj: any) => {
    return JSON.parse(JSON.stringify(obj));
}

export const parseWithSafeInt = (jsonString: string) => {
    return fixPrototype(
        JSONbig({
            storeAsString: true,
        })
    .parse(jsonString));
}