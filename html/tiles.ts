import ktg5Icon from './img/tiles/icons/ktg5.webp';


const tiles = {
    'ktg5': {
        logoPrevSize: '20%',
        icon: ktg5Icon,
        src: "html/ktg5.html",
    },
    'subscribe': {
        icon: "/img/tiles/icons/sub.webp",
        src: "/sub.html"
    },
    'bfprofeditor': {
        icon: '',
        src: '/bfprofeditor/index.html',
        root: 'bfprofeditor'
    },
    'patcat': {
        icon: "/img/tiles/icons/patcat.webp",
        src: "html/patcat.html"
    }
};

export type TileKeys = keyof typeof tiles;


export default {
    tiles
}
