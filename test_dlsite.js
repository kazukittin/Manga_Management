import { load } from 'cheerio';
import fs from 'fs';

const test = async () => {
    try {
        const query = 'RJ01235121';
        console.log('Searching for:', query);
        const searchUrl = 'https://www.dlsite.com/maniax/fsr/=/language/jp/keyword/' + encodeURIComponent(query);
        const searchRes = await fetch(searchUrl);
        const html = await searchRes.text();

        fs.writeFileSync('dlsite_debug.html', html);
        console.log('Saved dlsite_debug.html');

        const $ = load(html);
        console.log('Title:', $('title').text());
        // Try to find ANY link that looks like a product link
        const links = [];
        $('a[href*="/product_id/RJ"]').each((i, el) => {
            if (i < 5) links.push($(el).attr('href'));
        });
        console.log('Found Product Links:', links);

        // Check if there is a "No results" message?
        console.log('Zero results message:', $('.search_result_none').text().trim());

    } catch (e) { console.error(e); }
};
test();
