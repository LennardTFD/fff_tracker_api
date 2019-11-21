class Cache
{

    constructor(props) {
        this.cache = {};
    }

    reset()
    {
        console.log("Reseting cache!");
        this.cache = {};
        //console.log(this.cache);
    }

    readCache(keys)
    {
        if(!this.keyExists(keys)) return;
    }

    writeCache(keys, value)
    {
        if(!this.keyExists(keys)) return;

        //this.cache = Object.assign(this.cache, )
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
                if(typeof keys[i] == "number")
                {
                    keyString += "[" + keys[i] + "]";
                }
                else
                {
                    keyString += "['" + keys[i] + "']";
                }

            }else {
                return false;
            }
        }
        return true;
    }
}

module.exports = Cache;