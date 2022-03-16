const redisClient = require("../config/redis");

/*
    roomObj = { 
        'room_id': {
            'id': 'room_id',
            'players': [user1, user2], 
            'moves': [], 
            'time': 60 (in minutes), 
            'password': 'password', 
            gameStarted: false 
        } 
    }
*/

let numberOfRoomIndices = {
    'beginner': 0,
    'intermediate': 1,
    'advanced': 2,
    'expert': 3
}

const createRoom = (roomId, user, time, password=null) => {
    let room = {id: roomId, players: [null, null], moves: [], time, gameStarted: false}
    room.players[0] = user

    if(password){
        room.password = password;
    }

    redisClient.set(roomId, JSON.stringify(room));

    redisClient.get('rooms', (err, reply) => {
        if(err) throw err;

        let rooms;
        let index;

        if(reply){
            rooms = JSON.parse(reply);

            index = rooms.length;

            rooms.push(room);
        }else{
            index = 0;
            rooms = [room]
        }

        redisClient.set('rooms', JSON.stringify(rooms));

        redisClient.get('roomIndices', (err, reply) => {
            if(err) throw err;

            let roomIndices;

            if(reply){
                roomIndices = JSON.parse(reply);
            }else{
                roomIndices = {}
            }

            roomIndices[`${roomId}`] = index;

            redisClient.set('roomIndices', JSON.stringify(roomIndices));
        })
    })

    redisClient.get('total-rooms', (err, reply) => {
        if(err) throw err;

        if(reply){
            let totalRooms = parseInt(reply)

            totalRooms += 1;

            redisClient.set('totalRooms', totalRooms + "")
        }else{
            redisClient.set('totalRooms', "1")
        }
    })

    redisClient.get('number-of-rooms', (err, reply) => {
        if(err) throw err;

        let numberOfRooms = [0, 0, 0, 0]

        if(reply){
            numberOfRooms = JSON.parse(reply)
        }

        numberOfRooms[numberOfRoomIndices[user.user_rank]] += 1;

        redisClient.set('number-of-rooms', JSON.stringify(numberOfRooms));
    })
}

const joinRoom = (roomId, user) => {
    redisClient.get(roomId, (err, reply) => {
        if(err) throw err;

        if(reply){
            let room = JSON.parse(reply);

            room.players[1] = user;

            redisClient.set(roomId, JSON.stringify(room));

            redisClient.get('roomIndices', (err, reply) => {
                if(err) throw err;

                if(reply){
                    let roomIndices = JSON.parse(reply);

                    redisClient.get('rooms', (err, reply) => {
                        if(err) throw err;

                        if(reply){
                            let rooms = JSON.parse(reply);

                            rooms[roomIndices[roomId]].players[1] = user;
                            redisClient.set('rooms', JSON.stringify(rooms))
                        }
                    })
                }
            })
        }
    })
}

const removeRoom = (roomId, userRank) => {
    redisClient.del(roomId);

    redisClient.get('roomIndices', (err, reply) => {
        if(err) throw err;

        if(reply){
            let roomIndices = JSON.parse(reply);

            redisClient.get('rooms', (err, reply) => {
                if(err) throw err;

                if(reply){
                    let rooms = JSON.parse(reply);

                    rooms.splice(roomIndices[roomId], 1)
                    delete roomIndices[roomId];

                    redisClient.set('rooms', JSON.stringify(rooms));
                    redisClient.set('roomIndices', JSON.stringify(roomIndices));
                }
            })
        }
    })

    redisClient.get('total-rooms', (err, reply) => {
        if(err) throw err;

        if(reply){
            let totalRooms = parseInt(reply)

            totalRooms -= 1;

            redisClient.set('totalRooms', totalRooms + "")
        }
    })

    redisClient.get('number-of-rooms', (err, reply) => {
        if(err) throw err;

        if(reply){
            numberOfRooms = JSON.parse(reply)

            numberOfRooms[numberOfRoomIndices[userRank]] -= 1;

            redisClient.set('number-of-rooms', JSON.stringify(numberOfRooms));
        }
    })
}

module.exports = {createRoom, joinRoom, removeRoom}