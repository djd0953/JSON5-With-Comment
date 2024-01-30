const LineTapKeyword = '\t';
const CommentLineSeparator = '\n';
const BaseCommentKey = "baseComment";
let stringPoint;
let replacer;
let comment;
let afterComment;
let lastSerializeOid;

export default function stringify (object, option)
{
    stringPoint = 
    {
        depth: 0
    };
    
    replacer = 
    {
        isHex: false,
        hexKeywords: option?.hexKeywords ?? [],
        isStartTap: false,
        isStartDepthChange: true,
        isEndDepthChange: true,
    };
    
    comment = option?.comment ?? undefined;
    lastSerializeOid = 0;

    try
    {
        if (object === null || typeof object !== "object") 
            throw new Error(`Not Object`);

        if (Object.keys(object).length < 1)
            return "{}";

        return serializeObject(object, comment);
    }
    catch (err)
    {
        console.warn(`Json5 Stringify Error :: `, err);
        return null;
    }
}

const serializeObject = (obj, cmt) =>
{
    let rtv = "";
    let i = 1;
    const length = Object.keys(obj).length;

    try
    {
        if (replacer.isStartTap) rtv += addLineTap(stringPoint.depth);
        if (replacer.isStartDepthChange) stringPoint.depth++;

        rtv += "{\n";
        for (const key in obj)
        {
            isHexStringChange(key);
            rtv += addLineTap(stringPoint.depth);

            if (replacer.hexKeywords.length > 0 && !isNaN(Number(key)))
            {
                rtv += `${createHexString(key)}: `;
                lastSerializeOid = Number(key);
            }
            else
                rtv += `${key}: `;

            if (Array.isArray(obj[key]))
            {
                rtv += serializeArray(obj[key], cmt ? cmt[key] : undefined);
            }
            else if (obj[key] !== null && typeof obj[key] === "object")
            {
                rtv += serializeObject(obj[key], cmt ? cmt[key] : undefined);
            }
            else
            {
                rtv += addQuote(obj[key]);
            }

            if (length > i++) rtv += ",";
            rtv += "\n";

            if (Array.isArray(obj[key]) || (obj[key] !== null && typeof obj[key] === "object"))
            {
                if (afterComment)
                {
                    rtv += commentLineUp(afterComment);
                    afterComment = undefined;
                }
            }
            else if (cmt && cmt[key])
            {
                rtv += commentLineUp(cmt[key]);
            }
        }

        stringPoint.depth--;
        rtv += addLineTap(stringPoint.depth);

        rtv += '}';

        if (obj[BaseCommentKey]) afterComment = obj[BaseCommentKey];
    }
    catch (err)
    {
        console.warn(`Json5 Stringify Error :: `, err);
        rtv = null;
    }

    return rtv;
}

const serializeArray = (arr, cmt) =>
{
    let rtv = '';
    let isEndDepthChange = true;
    let isEndTap = false;
    stringPoint.depth++;
    replacer.isStartTap = false;
    replacer.isStartDepthChange = false;
  
    try
    {
        rtv += "[";
        arr.forEach((val, i) =>
        {
            let originHexChangeBool = replacer.isHex;

            if (Array.isArray(val))
            {
                rtv += serializeArray(val, cmt ? cmt[i] : undefined);
            }
            else if (val !== null && typeof val === "object")
            {
                isEndDepthChange = false;

                if (arr.length > 1 && i > 0)
                {
                    replacer.isStartTap = true;
                    replacer.isStartDepthChange = true;
                }

                rtv += serializeObject(val, cmt ? cmt[i] : undefined);

                isEndDepthChange = false;
            }
            else
            {
                if (typeof val === "string" && !replacer.isHex)
                {
                    rtv += `\n${addLineTap(stringPoint.depth)}`;
                    isEndTap = true;
                }

                rtv += addQuote(val);
            }

            if (arr.length - 1 > i)
            {
                rtv += ",";

                if (typeof arr[i] === "object" && arr[i + 1] && typeof arr[i + 1] === "object")
                    rtv += '\n';
            }

            if (cmt && cmt[i])
            {
                if (typeof val !== "object" || (val === "string" && replacer.isHex))
                    rtv += `\n`;

                rtv += commentLineUp(cmt[i]);
            }

            replacer.isHex = originHexChangeBool;
        });
      
        if (typeof arr[arr.length - 1] === "string" && !replacer.isHex)
            rtv += "\n";
        
        if (isEndDepthChange) stringPoint.depth--;
        if (isEndTap) rtv += addLineTap(stringPoint.depth);
        rtv += `]`;

        replacer.isStartDepthChange = true;
        replacer.isStartTap = false;

        if (arr[-1]) afterComment = arr[-1];
    }
    catch (err)
    {
      rtv += "]";
    }
  
    return rtv;
}

const addQuote = (value) =>
{
    if (value === null) return "null";

    switch (typeof value)
    {
    case "number":
    case "boolean":
        return replacer.isHex ? createHexString(value) : value;

    case "string":
        return replacer.isHex ? createHexString(value) : `'${value}'`;
    }
}

const createHexString = (value) =>
{
    try
    {
        if (isNaN(value)) return `'${value}'`;

        switch (typeof value)
        {
            case "string": 
            case "number": 
                return `0x${Number(value).toString(16).padStart(16, 0).toUpperCase()}`;
            case "object":
            if (Array.isArray(value))
                return value.map(val => createHexString(val));
    
        default: return value;
        }
    }
    catch (err)
    {
        return value;
    }
}

const addLineTap = (depth) =>
{
  let rtv = "";
  for (let i = 0 ; i < depth; i++) rtv += LineTapKeyword;

  return rtv;
}

const commentLineUp = (value) =>
{
    let rtv = "";

    if (typeof value !== "string") return rtv;

    let commentLines = value.split(CommentLineSeparator);
    commentLines.forEach(line => rtv += `${addLineTap(stringPoint.depth)}//${line}\n`);
    
    return rtv;
}

let nowKey;
const isHexStringChange = (key) =>
{
    nowKey = key;
    replacer.isHex = replacer.hexKeywords.some(searchHexKeyword);
}

const searchHexKeyword = (object) =>
{
    const nowType = (lastSerializeOid & 0x00000000ff000000) >> 24;
    const nowSubType = (lastSerializeOid & 0x0000000000ff0000) >> 16;

    return (
        nowType === object.type &&
        nowSubType === object.subType &&
        nowKey === object.key
    )
}
