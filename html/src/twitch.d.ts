class TwitchGql {
    constructor(clientid: string, oauth: string);

    /**
     * get channel information from a name
     * @param name username of twitch channel
     */
    getChannel(name: string): Promise<getChannelData>;

    /**
     * get channel vods from a channel name
     * @param name username of twitch channel
     * @param limit (defaults to `100`) the amount of vods to get from said channel
     */
    getChannelVods(name: string, limit?: number);
}
export type getChannelData = {
    live: boolean,
    profileURL: string,
    profileImageURL: string,
    displayName: string,
    broadcastSettings: {
        title: string
    },
    stream: {
        viewersCount: number
    }
    schedule?: {
        nextSegment: {
            startAt: number
        }
    }
}


export const twitchgql: TwitchGql;
