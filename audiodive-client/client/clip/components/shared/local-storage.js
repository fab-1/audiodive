let hasLocalStorage = localStorage

if (hasLocalStorage) {
    let testKey = 'react-localstorage.hoc.test-key';
    try {
        // Access to global `localStorage` property must be guarded as it
        // fails under iOS private session mode.
        localStorage.setItem( testKey, 'foo' )
        localStorage.removeItem(testKey)
    } catch (e) {
        hasLocalStorage = false;
    }
}

export default hasLocalStorage