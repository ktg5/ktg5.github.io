const anonKey = "kimne78kx3ncx6brgo4mv6wki5h1ko";

class TwitchGql {
    clientid = "";
    oauth = "";
    integToken = {
        token: "",
        expiration: 0
    };

    constructor(clientid, oauth) {
        this.clientid = clientid;
        this.oauth = oauth;
    }


    async getChannel(name) {
        if (!name) return console.error(`"name" is required but returned null.`);

        return new Promise(async (resolve, reject) => {
            await fetch("https://gql.twitch.tv/gql", {
                headers: {
                    "client-id": this.clientid,
                },
                body: JSON.stringify([
                    {
                        "operationName": "VideoPlayerStreamInfoOverlayChannel",
                        "variables": {
                            "channel": name
                        },
                        "extensions": {
                            "persistedQuery": {
                                "version": 1,
                                "sha256Hash": "198492e0857f6aedead9665c81c5a06d67b25b58034649687124083ff288597d"
                            }
                        }
                    },
                    {
                        "operationName": "ActiveWatchParty",
                        "variables": {
                            "channelLogin": name
                        },
                        "extensions": {
                            "persistedQuery": {
                                "version": 1,
                                "sha256Hash": "4a8156c97b19e3a36e081cf6d6ddb5dbf9f9b02ae60e4d2ff26ed70aebc80a30"
                            }
                        }
                    },
                    {
                        "operationName": "Chat_ChannelData",
                        "variables": {
                            "channelLogin": name
                        },
                        "extensions": {
                            "persistedQuery": {
                                "version": 1,
                                "sha256Hash": "3c445f9a8315fa164f2d3fb12c2f932754c2f2c129f952605b9ec6cf026dd362"
                            }
                        }
                    },
                    {
                        "operationName": "ChannelRoot_AboutPanel",
                        "variables": {
                            "channelLogin": name,
                            "skipSchedule": false,
                            "includeIsDJ": true
                        },
                        "extensions": {
                            "persistedQuery": {
                                "version": 1,
                                "sha256Hash": "0df42c4d26990ec1216d0b815c92cc4a4a806e25b352b66ac1dd91d5a1d59b80"
                            }
                        }
                    }
                ]),
                method: "POST"
            }).then(async rawData => {
                let data = await rawData.json();
        
                if (data.errors) resolve({ errors: data.errors });
                else {
                    if (!data[0].data.user) return resolve(null);
        
                    let isLive = data[0].data.user.stream != null;
        
                    let gameSlug;
                    if (data[0].data.user.broadcastSettings.game) gameSlug = data[0].data.user.broadcastSettings.game.slug;
                    let cleanData = {
                        live: isLive,
                        ...data[0].data.user,
                        watchParty: data[1].data.user.activeWatchParty,
                        chatRules: data[2].data.channel.chatSettings.rules,
                        description: data[3].data.user.description,
                        primaryColor: data[3].data.user.primaryColorHex,
                        followerCount: data[3].data.user.followers.totalCount,
                        roles: data[3].data.user.roles,
                        schedule: data[3].data.user.channel.schedule,
                        primaryTeam: data[3].data.user.primaryTeam
                    };
        
                    resolve(cleanData);
                }
            });
        });
    }

    async getChannelVods(name, limit) {
        if (!name) return console.error(`"name" is required but returned null.`);

        return new Promise(async (resolve, reject) => {
            await fetch("https://gql.twitch.tv/gql", {
                headers: {
                    "client-id": this.clientid,
                },
                body: JSON.stringify({
                    "operationName": "FilterableVideoTower_Videos",
                    "variables": {
                        "includePreviewBlur": false,
                        "limit": limit ? limit : 100,
                        "channelOwnerLogin": name,
                        "broadcastType": "ARCHIVE",
                        "videoSort": "TIME"
                    },
                    "extensions": {
                        "persistedQuery": {
                            "version": 1,
                            "sha256Hash": "acea7539a293dfd30f0b0b81a263134bb5d9a7175592e14ac3f7c77b192de416"
                        }
                    }
                }),
                method: "POST"
            }).then(async rawData => {
                let data = await rawData.json();
                if (data.errors) resolve({ errors: data.errors });

                let cleanData = [];
                if (!data.data.user) resolve(null);
                for (let i = 0; i < data.data.user.videos.edges.length; i++) {
                    const element = data.data.user.videos.edges[i];
                    cleanData[i] = element.node;
                }
                resolve(cleanData);
            });
        });
    }
}

var twitchgql = new TwitchGql(anonKey);
