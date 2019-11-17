class Cache
{

    constructor(props) {
        this.cache = {};
    }

    readCache(keys)
    {
        if(!this.keyExists(keys)) return;
    }

    writeCache(keys, value)
    {
        if(!this.keyExists(keys)) return;



        this.cache = Object.assign(this.cache, )
    }

    keyExists(keys)
    {
        //console.log(this.cache);
        let keyString = "";
        for(let i = 0; i < keys.length; i++)
        {
            keys[i] = String(keys[i]);
            if(keys[i] in eval("this.cache" + keyString))
            {
                console.log(keys);
                //console.log(this.cache[keys[0]]);
                //console.log("cache" + keyString);
                if(typeof keys[i] == "number")
                {
                    keyString += "[" + keys[i] + "]";
                }
                else
                {
                    keyString += "['" + keys[i] + "']";
                }

            }else {
                console.log(keyString + " does not exist");
                return false;
            }
        }
        console.log(keyString + " does exist");
        return true;
    }
}

module.exports = Cache;