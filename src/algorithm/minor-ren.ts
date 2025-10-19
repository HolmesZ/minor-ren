export const minorRenNames = [ '大安', '留连', '速喜', '赤口', '小吉', '空亡' ];

/** 计算小六壬 */
export function calculateMinorRen(x: number, y: number, z: number): [string, string, string] {
    if (x < 1 || y < 1 || z < 1) {
        throw new Error("输入的数字必须大于等于1");
    }

    const index1 = (x - 1) % 6;
    const index2 = (x + y - 2) % 6;
    const index3 = (x + y + z - 3) % 6;

    return [minorRenNames[index1]!, minorRenNames[index2]!, minorRenNames[index3]!];
}

/** 生成 [min, max] 的真随机整数（含端点） */
function randInt(min: number, max: number): number {
    const range = max - min + 1;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const maxValue = Math.pow(256, bytesNeeded);
    const randomBytes = new Uint8Array(bytesNeeded);
    
    let randomValue;
    do {
        crypto.getRandomValues(randomBytes);
        randomValue = randomBytes.reduce((acc, byte, i) => acc + byte * Math.pow(256, i), 0);
    } while (randomValue >= maxValue - (maxValue % range));
    
    return min + (randomValue % range);
}

export type MinorRenResult = {
    x: number;
    y: number;
    z: number;
    names: [string, string, string];
}

/**
 * 随机起课
 * @param max 上限，默认 60（含）
 */
export function startByRandom(min = 1, max = 60): MinorRenResult {
    const x = randInt(min, max);
    const y = randInt(min, max);
    const z = randInt(min, max);
    const names = calculateMinorRen(x, y, z);
    return { x, y, z, names };
}

/**
 * 时间起课：x 取当前时辰序（1..12），y 取分钟+1，z 取秒+1
 * 可传入自定义时间以便测试
 */
export function startByTime(d: Date = new Date()): MinorRenResult {
    const hour = d.getHours() % 12; // 0..11
    const x = hour + 1;
    const y = d.getMinutes() + 1;
    const z = d.getSeconds() + 1;
    const names = calculateMinorRen(x, y, z);
    return { x, y, z, names };
}
