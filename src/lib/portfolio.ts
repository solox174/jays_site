export type BeforeAndAfterPair = {
    video: string;
    services: string;
};

export async function getPortfolio(fetch: typeof globalThis.fetch): Promise<BeforeAndAfterPair[]> {
    const pairs: BeforeAndAfterPair[] = [];
    let count = 1;

    while (true) {
        const res = await fetch(`/portfolio/${count}/services.txt`);
        if (!res.ok) break;

        pairs.push({
            video: `/portfolio/${count}/video.mp4`,
            services: (await res.text()).trim()
        });
        count++;
    }

    return pairs;
}