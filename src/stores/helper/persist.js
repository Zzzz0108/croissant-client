/**
 * @description pinia 持久化参数配置
 * @param {String} key 存储到持久化的 name
 * @return persist
 * */
const piniaPersistConfig = (key) => {
    const persist = {
        key,
        storage: localStorage,
        // storage: sessionStorage,
    };
    return persist;
};

export default piniaPersistConfig; 