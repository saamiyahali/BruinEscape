export const LEVELS = [
    {
        id: 1,
        goalCoins: 15,
        speed: 20,
        obstacleTypes: ["sign"],
        obstacleWeights: {
            sign: 5
        },
        obstacleMin: 1,
        obstacleMax: 2,
        coinMin:3,
        coinMax: 4
    },
    {
        id: 2,
        goalCoins: 15,
        speed: 20,
        obstacleTypes: ["sign", "trash"],
        obstacleWeights: {
            sign: 5,
            trash: 5
        },
        obstacleMin: 1,
        obstacleMax: 3,
        coinMin:2,
        coinMax: 3
    },
    {
        id: 3,
        goalCoins: 15,
        speed: 25,
        obstacleTypes: ["sign", "trash", "student"],
        obstacleWeights: {
            sign: 3,
            trash: 3,
            student: 4
        },

        obstacleMin: 2,
        obstacleMax: 3,
        coinMin:2,
        coinMax: 3
    },
    {
        id: 4,
        goalCoins: 15,
        speed: 25,
        obstacleTypes: ["sign", "trash", "student", "pit"],
        obstacleWeights: {
            sign: 3,
            trash: 3,
            student: 2,
            pit: 2
        },
        obstacleMin: 2,
        obstacleMax: 3,
        coinMin:2,
        coinMax: 3
    },
        {
        id: 5,
        goalCoins: 20,
        speed: 30,
        obstacleTypes: ["sign", "trash", "student", "pit", "robot"],
        obstacleWeights: {
            sign: 2,
            trash: 2,
            student: 2,
            pit: 2,
            robot: 3
        },
        obstacleMin: 3,
        obstacleMax: 4,
        coinMin:2,
        coinMax: 3
    },
     {
        id: 6,
        goalCoins: 20,
        speed: 30,
        obstacleTypes: ["sign", "trash", "student", "pit", "robot", "alien"],
        obstacleWeights: {
            sign: 2,
            trash: 2,
            student: 2,
            pit: 2,
            robot: 3,
            alien: 3
        },
        obstacleMin: 4,
        obstacleMax: 5,
        coinMin: 1,
        coinMax: 2
    },
    {
        id: 7,
        goalCoins: 20,
        speed: 30,
        obstacleTypes: ["sign", "trash", "student", "pit", "robot", "alien", "slenderman"],
        obstacleWeights: {
            sign: 2,
            trash: 2,
            student: 3,
            pit: 2,
            robot: 2,
            alien: 2,
            slenderman: 0.2
        },
        obstacleMin: 5,
        obstacleMax: 6,
        coinMin: 1,
        coinMax: 1
    },
    {
        id: 8,
        goalCoins: 25,
        speed: 30,
        obstacleTypes: ["sign", "trash", "student", "pit", "robot", "alien", "slenderman", "fish"],
        obstacleWeights: {
            sign: 0.5,
            trash: 0.5,
            student: 0.1,
            pit: 0.5,
            robot: 0.5,
            alien: 0.25,
            slenderman: 0.1,
            fish: 6
        },
        obstacleMin: 5,
        obstacleMax: 7,
        coinMin: 1,
        coinMax: 1
    },
]