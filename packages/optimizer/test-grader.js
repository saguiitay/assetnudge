// Use compiled CommonJS output
const { gradeAsset } = require('./dist/index');
const fs = require('fs');

async function testGrader() {
  try {
    // Load exemplars
    const exemplars = JSON.parse(fs.readFileSync('./data/results/exemplars.json', 'utf-8'));
    const allExemplars = [];
    for (const cat in exemplars.exemplars) {
      allExemplars.push(...exemplars.exemplars[cat]);
    }
    
    console.log(`Grading ALL ${allExemplars.length} best sellers with DynamicAssetGrader...\n`);
    
    const results = [];
    let processed = 0;
    const progressInterval = Math.floor(allExemplars.length / 20); // Show progress 20 times
    
    for (const asset of allExemplars) {
      try {
        const { grade } = await gradeAsset(asset);
        
        const shortLen = asset.short_description?.length || 0;
        const longText = (asset.long_description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const longWords = longText ? longText.split(/\s+/).length : 0;
        
        results.push({
          title: asset.title,
          category: asset.category,
          letter: grade.letter,
          score: Math.round(grade.score),
          images: asset.images_count || 0,
          videos: asset.videos_count || 0,
          tags: asset.tags?.length || 0,
          shortLen,
          longWords
        });
        
        processed++;
        if (processed % progressInterval === 0) {
          const pct = Math.round((processed / allExemplars.length) * 100);
          console.log(`Progress: ${processed}/${allExemplars.length} (${pct}%)`);
        }
      } catch (err) {
        console.error(`Error grading ${asset.title}: ${err.message}`);
      }
    }
    
    // Summary stats
    const gradeCount = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    results.forEach(r => gradeCount[r.letter]++);
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total Graded: ${results.length}`);
    console.log(`Average Score: ${Math.round(avgScore)}/100`);
    console.log(`Grade Distribution:`);
    console.log(`  A (90-100): ${gradeCount.A} (${Math.round(gradeCount.A/results.length*100)}%)`);
    console.log(`  B (80-89):  ${gradeCount.B} (${Math.round(gradeCount.B/results.length*100)}%)`);
    console.log(`  C (70-79):  ${gradeCount.C} (${Math.round(gradeCount.C/results.length*100)}%)`);
    console.log(`  D (60-69):  ${gradeCount.D} (${Math.round(gradeCount.D/results.length*100)}%)`);
    console.log(`  F (<60):    ${gradeCount.F} (${Math.round(gradeCount.F/results.length*100)}%)`);
    
    // Content statistics
    const avgShortDesc = results.reduce((sum, r) => sum + r.shortLen, 0) / results.length;
    const avgLongDesc = results.reduce((sum, r) => sum + r.longWords, 0) / results.length;
    const avgVideos = results.reduce((sum, r) => sum + r.videos, 0) / results.length;
    const avgTags = results.reduce((sum, r) => sum + r.tags, 0) / results.length;
    const noShortDesc = results.filter(r => r.shortLen === 0).length;
    const noVideos = results.filter(r => r.videos === 0).length;
    const noTags = results.filter(r => r.tags === 0).length;
    
    console.log('\n=== CONTENT STATISTICS ===');
    console.log(`Avg Short Desc: ${Math.round(avgShortDesc)} chars (${noShortDesc} have none = ${Math.round(noShortDesc/results.length*100)}%)`);
    console.log(`Avg Long Desc: ${Math.round(avgLongDesc)} words`);
    console.log(`Avg Videos: ${avgVideos.toFixed(1)} (${noVideos} have none = ${Math.round(noVideos/results.length*100)}%)`);
    console.log(`Avg Tags: ${avgTags.toFixed(1)} (${noTags} have none = ${Math.round(noTags/results.length*100)}%)`);
    
    // Save detailed results
    fs.writeFileSync('test-grader-all-results.json', JSON.stringify({
      summary: {
        total: results.length,
        avgScore: Math.round(avgScore),
        gradeDistribution: gradeCount,
        contentStats: {
          avgShortDescChars: Math.round(avgShortDesc),
          avgLongDescWords: Math.round(avgLongDesc),
          avgVideos: parseFloat(avgVideos.toFixed(1)),
          avgTags: parseFloat(avgTags.toFixed(1)),
          noShortDescPct: Math.round(noShortDesc/results.length*100),
          noVideosPct: Math.round(noVideos/results.length*100),
          noTagsPct: Math.round(noTags/results.length*100)
        }
      },
      results: results
    }, null, 2));
    console.log('\nDetailed results saved to test-grader-all-results.json');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testGrader().catch(console.error);
