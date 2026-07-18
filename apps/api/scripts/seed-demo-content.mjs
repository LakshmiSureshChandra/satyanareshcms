// One-time demo-content population — run manually, exactly once:
//   node apps/api/scripts/seed-demo-content.mjs
//
// Guarded by the `demo_content_seeded` option: once it runs, it marks itself
// done and every future run (even after the admin deletes everything it
// created) is a no-op. It is never invoked automatically by the app.
import { db } from '../src/lib/db.js'
import { uniqueSlug } from '../src/lib/slug.js'

const MARKER = 'demo_content_seeded'

async function main() {
  const marker = await db.option.findUnique({ where: { key: MARKER } })
  if (marker?.value === 'true') {
    console.log('Demo content already seeded — nothing to do.')
    return
  }

  const admin = await db.user.findFirst({ where: { role: 'admin' }, orderBy: { id: 'asc' } })
  if (!admin) throw new Error('No admin user found — cannot attribute demo posts.')

  const daysAgo = (n) => new Date(Date.now() - n * 24 * 3600 * 1000)

  // ---- categories + posts ----
  const CATEGORIES = [
    {
      name: 'క్రీడలు',
      posts: [
        { title: 'స్థానిక క్రికెట్ టోర్నమెంట్ విజయవంతంగా ముగింపు', days: 2, body: 'నగరంలో నిర్వహించిన స్థానిక క్రికెట్ టోర్నమెంట్ ఘనంగా ముగిసింది. వివిధ జట్ల మధ్య జరిగిన పోటీలు ప్రేక్షకులను ఆకట్టుకున్నాయి. విజేత జట్టుకు నిర్వాహకులు ప్రత్యేక అభినందనలు తెలిపారు.\n\nఈ టోర్నమెంట్‌లో యువ ఆటగాళ్లు తమ ప్రతిభను ప్రదర్శించే అవకాశం లభించిందని నిర్వాహకులు తెలిపారు. వచ్చే ఏడాది మరింత పెద్ద స్థాయిలో నిర్వహించాలని యోచిస్తున్నట్లు వెల్లడించారు.' },
        { title: 'యువజన క్రీడా పోటీలకు నమోదు ప్రారంభం', days: 9, body: 'జిల్లా స్థాయి యువజన క్రీడా పోటీలకు నమోదు ప్రక్రియ ప్రారంభమైంది. ఆసక్తి గల యువకులు నిర్ణీత గడువులోపు దరఖాస్తు చేసుకోవాలని అధికారులు కోరారు.\n\nఅథ్లెటిక్స్, బ్యాడ్మింటన్, వాలీబాల్ వంటి క్రీడాంశాల్లో పోటీలు నిర్వహించనున్నారు. విజేతలకు నగదు బహుమతులతో పాటు ప్రశంసాపత్రాలు అందజేస్తారు.' },
        { title: 'పాఠశాలల మధ్య క్రీడోత్సవం ఘనంగా నిర్వహణ', days: 16, body: 'నగర పరిధిలోని వివిధ పాఠశాలల విద్యార్థుల మధ్య వార్షిక క్రీడోత్సవం ఘనంగా జరిగింది. పరుగు పందేలు, ఖో-ఖో, కబడ్డీ వంటి క్రీడాంశాల్లో విద్యార్థులు ఉత్సాహంగా పాల్గొన్నారు.\n\nవిజేతలైన విద్యార్థులకు పతకాలు, సర్టిఫికెట్లు అందజేశారు. ఇలాంటి కార్యక్రమాలు విద్యార్థుల్లో క్రీడాస్ఫూర్తిని పెంచుతాయని నిర్వాహకులు పేర్కొన్నారు.' },
      ],
    },
    {
      name: 'వ్యాపారం',
      posts: [
        { title: 'చిన్న వ్యాపారులకు కొత్త రుణ పథకం ప్రకటన', days: 3, body: 'స్థానిక చిన్న, మధ్య తరహా వ్యాపారులను ప్రోత్సహించేందుకు కొత్త రుణ పథకాన్ని ప్రకటించారు. తక్కువ వడ్డీ రేటుతో రుణాలు అందించనున్నట్లు అధికారులు తెలిపారు.\n\nఈ పథకం ద్వారా వ్యాపారులు తమ వ్యాపారాన్ని విస్తరించుకునేందుకు అవకాశం లభిస్తుందని భావిస్తున్నారు. దరఖాస్తు ప్రక్రియ వచ్చే వారం నుంచి ప్రారంభం కానుంది.' },
        { title: 'స్థానిక మార్కెట్లో ధరల స్థిరత్వం', days: 11, body: 'గత కొద్ది వారాలుగా నిత్యావసర వస్తువుల ధరలు స్థిరంగా ఉన్నాయని వ్యాపారులు తెలిపారు. దీనివల్ల వినియోగదారులకు ఊరట లభించినట్లు అయింది.\n\nరాబోయే పండుగ సీజన్‌లో డిమాండ్ పెరిగే అవకాశం ఉందని, అయినప్పటికీ ధరలు అదుపులో ఉంచేందుకు చర్యలు తీసుకుంటున్నట్లు అధికారులు వెల్లడించారు.' },
        { title: 'డిజిటల్ చెల్లింపులపై చిన్న వ్యాపారుల్లో అవగాహన సదస్సు', days: 20, body: 'డిజిటల్ చెల్లింపు విధానాలపై చిన్న వ్యాపారులకు అవగాహన కల్పించేందుకు ప్రత్యేక సదస్సు నిర్వహించారు. క్యూఆర్ కోడ్ చెల్లింపులు, ఆన్‌లైన్ లావాదేవీల భద్రతపై నిపుణులు వివరించారు.\n\nఈ సదస్సుకు పెద్ద సంఖ్యలో వ్యాపారులు హాజరై, తమ సందేహాలను నివృత్తి చేసుకున్నారు.' },
      ],
    },
    {
      name: 'సినిమా',
      posts: [
        { title: 'కొత్త తెలుగు చిత్రం చిత్రీకరణ ప్రారంభం', days: 1, body: 'ఓ కొత్త తెలుగు చిత్రం చిత్రీకరణ ఘనంగా ప్రారంభమైంది. ఈ సందర్భంగా చిత్రబృందం మీడియాతో మాట్లాడుతూ కథా నేపథ్యంపై ఆసక్తికర విషయాలు పంచుకుంది.\n\nఈ చిత్రం వచ్చే ఏడాది ప్రేక్షకుల ముందుకు రానుందని నిర్మాతలు తెలిపారు.' },
        { title: 'స్థానిక చిత్రోత్సవంలో పలు లఘు చిత్రాల ప్రదర్శన', days: 8, body: 'నగరంలో నిర్వహించిన లఘు చిత్రోత్సవంలో యువ దర్శకుల చిత్రాలు ప్రదర్శించారు. వైవిధ్యభరితమైన కథాంశాలతో ఈ చిత్రాలు ప్రేక్షకుల ప్రశంసలు అందుకున్నాయి.\n\nఉత్తమ లఘు చిత్రంగా ఎంపికైన చిత్రానికి ప్రత్యేక పురస్కారం అందజేశారు.' },
        { title: 'సినీ నటుల భేటీలో సాంకేతిక వర్గాలకు అభినందనలు', days: 14, body: 'ఇటీవల జరిగిన ఒక సినీ కార్యక్రమంలో సాంకేతిక వర్గాల కృషిని ప్రముఖులు అభినందించారు. చిత్ర నిర్మాణంలో సాంకేతిక నిపుణుల పాత్ర కీలకమని పేర్కొన్నారు.\n\nఈ కార్యక్రమంలో పలువురు సినీ ప్రముఖులు పాల్గొన్నారు.' },
      ],
    },
    {
      name: 'విద్య',
      posts: [
        { title: 'ప్రభుత్వ పాఠశాలల్లో డిజిటల్ తరగతుల విస్తరణ', days: 4, body: 'ప్రభుత్వ పాఠశాలల్లో డిజిటల్ తరగతి గదులను మరింత విస్తరించనున్నట్లు విద్యాశాఖ ప్రకటించింది. దీనివల్ల విద్యార్థులకు నాణ్యమైన బోధన అందించేందుకు వీలుంటుందని అధికారులు తెలిపారు.\n\nఈ ఏడాది చివరికల్లా అన్ని పాఠశాలల్లో ఈ సదుపాయం అందుబాటులోకి తీసుకురానున్నట్లు వెల్లడించారు.' },
        { title: 'విద్యార్థుల కోసం ఉచిత నైపుణ్య శిక్షణ కార్యక్రమం', days: 12, body: 'నిరుద్యోగ యువతకు ఉపాధి అవకాశాలు మెరుగుపరిచేందుకు ఉచిత నైపుణ్య శిక్షణ కార్యక్రమాన్ని ప్రారంభించారు. కంప్యూటర్ కోర్సులు, కమ్యూనికేషన్ నైపుణ్యాలపై శిక్షణ ఇవ్వనున్నారు.\n\nఆసక్తి గల యువత స్థానిక కార్యాలయంలో పేర్లు నమోదు చేసుకోవచ్చని అధికారులు తెలిపారు.' },
        { title: 'పాఠశాల విద్యార్థుల కోసం గ్రంథాలయ వారోత్సవాలు', days: 18, body: 'చదవడం పట్ల ఆసక్తిని పెంచేందుకు పాఠశాలల్లో గ్రంథాలయ వారోత్సవాలు నిర్వహించారు. ఈ సందర్భంగా వ్యాస రచన, పుస్తక సమీక్ష పోటీలు ఏర్పాటు చేశారు.\n\nవిజేతలైన విద్యార్థులకు పుస్తకాలను బహుమతిగా అందజేశారు.' },
      ],
    },
    {
      name: 'ఆరోగ్యం',
      posts: [
        { title: 'ఉచిత ఆరోగ్య పరీక్షల శిబిరం నిర్వహణ', days: 5, body: 'స్థానిక ఆసుపత్రి ఆధ్వర్యంలో ఉచిత ఆరోగ్య పరీక్షల శిబిరం నిర్వహించారు. రక్తపోటు, మధుమేహం వంటి పరీక్షలు ఉచితంగా నిర్వహించి, అవసరమైన వారికి వైద్య సలహాలు అందించారు.\n\nఈ శిబిరానికి పెద్ద సంఖ్యలో స్థానికులు హాజరయ్యారు.' },
        { title: 'వర్షాకాలంలో తీసుకోవాల్సిన జాగ్రత్తలపై అవగాహన', days: 13, body: 'వర్షాకాలంలో వ్యాపించే వ్యాధులపై ప్రజల్లో అవగాహన కల్పించేందుకు వైద్య శిబిరం నిర్వహించారు. పరిశుభ్రమైన నీరు తాగడం, పరిసరాల పరిశుభ్రత పాటించడంపై నిపుణులు సూచనలు ఇచ్చారు.\n\nఏదైనా అనారోగ్య లక్షణాలు కనిపిస్తే వెంటనే వైద్యులను సంప్రదించాలని కోరారు.' },
        { title: 'రక్తదాన శిబిరానికి విశేష స్పందన', days: 21, body: 'స్థానికంగా నిర్వహించిన రక్తదాన శిబిరానికి యువత నుంచి విశేష స్పందన లభించింది. పెద్ద సంఖ్యలో వాలంటీర్లు రక్తదానం చేసి, స్ఫూర్తిదాయకంగా నిలిచారు.\n\nసేకరించిన రక్తాన్ని స్థానిక బ్లడ్ బ్యాంకుకు అందజేసినట్లు నిర్వాహకులు తెలిపారు.' },
      ],
    },
  ]

  for (const cat of CATEGORIES) {
    let category = await db.category.findFirst({ where: { name: cat.name } })
    if (!category) {
      category = await db.category.create({
        data: { name: cat.name, slug: await uniqueSlug('category', cat.name), status: true },
      })
      console.log('created category', cat.name)
    }

    for (const p of cat.posts) {
      const exists = await db.post.findFirst({ where: { title: p.title } })
      if (exists) continue
      const post = await db.post.create({
        data: {
          title: p.title,
          slug: await uniqueSlug('post', p.title),
          content: p.body.split('\n\n').map((para) => `<p>${para}</p>`).join(''),
          type: 'post',
          status: true,
          publishedAt: daysAgo(p.days),
          createdBy: admin.id,
        },
      })
      await db.categoryPost.create({ data: { postId: post.id, categoryId: category.id } })
      console.log('created post', p.title)
    }
  }

  // ---- gallery: categories + albums (no photos — added manually later) ----
  const GALLERY = [
    { name: 'వేడుకలు', albums: ['వార్షిక వేడుక 2026', 'స్థాపన దినోత్సవం'] },
    { name: 'కార్యక్రమాలు', albums: ['అవగాహన సదస్సు', 'సామాజిక సేవా కార్యక్రమం'] },
  ]
  for (const g of GALLERY) {
    let category = await db.galleryCategory.findFirst({ where: { name: g.name } })
    if (!category) {
      category = await db.galleryCategory.create({
        data: { name: g.name, slug: await uniqueSlug('galleryCategory', g.name), status: true },
      })
      console.log('created gallery category', g.name)
    }
    for (const title of g.albums) {
      const exists = await db.galleryAlbum.findFirst({ where: { title } })
      if (exists) continue
      await db.galleryAlbum.create({
        data: {
          title,
          slug: await uniqueSlug('galleryAlbum', title),
          status: true,
          publishedAt: daysAgo(7),
          categoryId: category.id,
          createdBy: admin.id,
        },
      })
      console.log('created gallery album', title)
    }
  }

  // ---- polls (one live, two archived, with plausible pre-set vote counts) ----
  const POLLS = [
    {
      title: 'మా వెబ్‌సైట్ కొత్త డిజైన్ మీకు ఎలా అనిపించింది?',
      status: true,
      options: [
        ['చాలా బాగుంది', 42],
        ['బాగుంది', 27],
        ['మెరుగుపరచాలి', 9],
      ],
    },
    {
      title: 'మీరు రోజూ మా వెబ్‌సైట్‌ను సందర్శిస్తారా?',
      status: false,
      options: [
        ['అవును', 58],
        ['కొన్నిసార్లు', 31],
        ['లేదు', 6],
      ],
    },
    {
      title: 'మీకు ఏ విభాగం వార్తలు ఎక్కువ ఇష్టం?',
      status: false,
      options: [
        ['క్రీడలు', 22],
        ['సినిమా', 35],
        ['విద్య', 14],
        ['ఆరోగ్యం', 11],
      ],
    },
  ]
  for (const p of POLLS) {
    const exists = await db.poll.findFirst({ where: { title: p.title } })
    if (exists) continue
    await db.poll.create({
      data: {
        title: p.title,
        status: p.status,
        options: { create: p.options.map(([text, votes], i) => ({ text, votes, sortOrder: i })) },
      },
    })
    console.log('created poll', p.title)
  }

  await db.option.upsert({
    where: { key: MARKER },
    create: { key: MARKER, value: 'true' },
    update: { value: 'true' },
  })
  console.log('Done — demo content seeded and marked so this never runs again.')
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => db.$disconnect())
