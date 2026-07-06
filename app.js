const isMobile =
  (typeof window !== 'undefined') &&
  (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768);

const SIZE = 256;
// NOTE: previously dropped to 2x on mobile to save memory, but that's a
// visible quality regression and isn't actually needed -- reusing the
// graphics buffer/typed array in regenerateDither()/ditherFloydSteinbergBW()
// below already eliminates the repeated large allocations that were
// driving memory up. Keep resolution the same on all devices.
const SCALE = 4;
const CONNECT_DISTANCE = 60;
const STAR_COLOR = [236, 223, 172, 255];

// Instead of re-running pix2pix, we "fake" regeneration by jittering the
// continuous-tone base image with a little noise and re-dithering it on
// an interval. Same look as the old live transfer, none of the cost.
const REGEN_INTERVAL_FRAMES = isMobile ? 24 : 12; // regen less often on mobile
const REGEN_NOISE_AMOUNT = 18;    // how much brightness jitter to add before re-dithering

let STAR_TEXTS = [
    '<img id=\'light-box-image\' src=\'./images/poster.png\'><figcaption>Poster seen at my place of work.</figcaption><p>"The parallels in the rhetoric surrounding foreign plants and those of foreign peoples are striking… The first parallel is that aliens are \'other\'... Second is the idea that aliens/exotic plants are everywhere, taking over everything… The third parallel is the suggestion that they are growing in strength and number … The fourth parallel is that aliens are difficult to destroy and will persist because they can withstand extreme situations… The fifth parallel is that aliens are \'aggressive predators and pests and are prolific in nature, reproducing rapidly\'... Finally, like human immigrants, the greatest focus is on their economic costs because it is believed that they consume resources and return nothing (2001)"<br><em><a target="_blank" href="https://www.jstor.org/stable/40338794">The Aliens Have Landed! Reflections on the Rhetoric of Biological Invasions by Banu Subramaniam</a></em></p>',
    '<p>"We can choose to malign their resourcefulness or to appreciate it. C.Jenkins and S.Pimm [2003] concluded that about 23% of the world\'s ice-free land area is disturbed, forming a `global weed patch` favorable for IS (Invasive Species). We have changed global climate and nitrogen deposition patterns and created eutrophic wetlands. We have certainly contributed to the capacity for IS to \'survive and thrive\' in new places. They are symbionts of ours. They are a consequence of how we live on the earth."<br><em><a target="_blank" href="https://journals.openedition.org/etudesrurales/9018">REWEAVING NARRATIVES ABOUT HUMANS AND INVASIVE SPECIES by Brendon M.H. Larson</a></em></p>',
    '<p>"If we wish to lament them we could consider them as our spawn rather than as invaders for which we have no responsibility. Their occurrence outside their historical distribution results from our actions, from the choices we have made as a species (and as individuals), and from our habits: our consumption, our travel, our never-ending search for greater efficiency, productivity and speed. It is in part because of these patterns that IS (Invasive Species) are out of control."<br><em><a target="_blank" href="https://journals.openedition.org/etudesrurales/9018">REWEAVING NARRATIVES ABOUT HUMANS AND INVASIVE SPECIES by Brendon M.H. Larson</a></em></p>',
    '<p>"Non-native species comprise most of the plants that humans grow for food. They are our lifeblood. Yet from the perspective of the land, they are just as harmful as IS. I think one of the great ironies of invasion biology is that as the settlers moved westward in North America, they despised wilderness and eradicated it and its denizens to replace it with non-native species to supply their food."<br><em><a target="_blank" href="https://journals.openedition.org/etudesrurales/9018">REWEAVING NARRATIVES ABOUT HUMANS AND INVASIVE SPECIES by Brendon M.H. Larson</a></em></p>',
    '<img id=\'light-box-image\' src=\'./images/queen.png\'><figcaption>Honeybees from my community hive. Can you spot the queen?</figcaption><p>"Honeybee" can refer to all the species of the genus Apis, but in the United States the term most commonly refers to the European "races" of the species Apis mellifera. No species of Apis are indigenous to the New World; the familiar pollinator and honey producer Apis mellifera (which in this section I\'ll call honeybees or bees) was brought over by European colonists as part of the ecological package in which they conquered and transformed the New World with Old World flora and fauna"<br><em><a target="_blank" href="https://www.re-search.se/projects/humansandbees/texts/Empowering%20Nature,%20or%20Some%20Gleanings%20in%20Bee%20Culture,%20Anna%20Lowenhaupt%20Tsing%20(1995).pdf">Empowering Nature, or: Some Gleanings in Bee Culture by Anna Lowenhaupt Tsing</a></em></p>',
    '<p>"In the late nineteenth and early twentieth centuries, U.S. interest in honeybee races-as well as human races-was focused on the differences among European races. There were German bees, Italian bees, Caucasian bees (from the Russian Caucasus), Cariolan bees (from Austria and the Balkans), as well as a variety of less-discussed Middle Eastern, or "Oriental" bees-Syrian, Macedonian, and more. Although judged in many ways like human races, they had their colors backwards: the northern races were dark and the southern ones blond. During this entrepreneurial period, most U.S. beekeepers advocated appropriate hybridization among these races, with a strong preference for the light-colored Italians. (Despite the disapproval of experts, who promoted hybridization, U.S. beekeepers selected even among Italians for the most light-colored bees.) Work on hybridizing bees, as well as other plants and animals, was tied to U.S. eugenic theories in which for people, too, the nation was built up by combining the best of the European races."</p><br><em><a target="_blank" href="https://www.re-search.se/projects/humansandbees/texts/Empowering%20Nature,%20or%20Some%20Gleanings%20in%20Bee%20Culture,%20Anna%20Lowenhaupt%20Tsing%20(1995).pdf">Empowering Nature, or: Some Gleanings in Bee Culture by Anna Lowenhaupt Tsing</a></em>',
    '<p>"In his article \'Natives and Nativism,\' Jonah Paretti persuasively argues that the language of exotic/alien plant and animal \'invasions\' reflects a pervasive nativism in conservation biology making environmentalists biased against alien species....The \'natives\', however, are, of course, the white settlers who reached the Americas to displace the original natives, to become its new, true natives. In this chapter it is the white settlers that come to be the \'local\' and the \'native\'....Instead, let us consider exotic/alien species in their diversities. Mark Sagoff points out that the broad generalizations of exotic/alien plants obscures the heterogeneity of the life histories, ecologies, and contributions of native and exotic plants. For example, he points out that nearly all the U.S. crops are exotic plants while most of the insects that cause crop damage are native species. It seems to me the height of irony that alongside a national campaign in the United States to keep out all exotic/alien plants in order to preserve the purity and sanctity of native habitats, there is simultaneously another campaign that promotes the widespread use of technologically bred, genetically modified organisms for agricultural purposes"<br><em><a target="_blank" href="https://www.jstor.org/stable/40338794">The Aliens Have Landed! Reflections on the Rhetoric of Biological Invasions by Banu Subramaniam</a></em></p>',
    '<p>"Exotic/alien plants are most often found on disturbed sites. Perhaps the increase in exotic/alien plants is less about their arrival and more about the shifts in quality of natural habitats through the process of development that allow their establishment. When habitats are degraded by humans, the change causes a shift in the selection pressures on plants at those sites."</p><br><em><a target="_blank" href="https://www.jstor.org/stable/40338794">The Aliens Have Landed! Reflections on the Rhetoric of Biological Invasions by Banu Subramaniam</a></em>',
    '<p>"Weeds are not always unlikeable. Rye and oats were once weeds; now they are crop plants..... Can a crop plant shift the other way and become a weed? Yes. Amaranth and crabgrass were prehistoric crops in America and Europes, respectively, both treasured for their nourishing seeds,  and now both have been demoted to weeds. Are weeds while in that category, always a bane and torment to everyone? No, indeed. Bermuda grass, one of the most irrepressible tropical weeds, was extolled a century and a half ago as a stabilizer of levees along the lower Mississippi at the same time that farmers not far from that river were calling it devilgrass..... Weeds are not good or bad; they are simply the plants that tempt the botanist to use such anthropomorphic terms as aggressive and opportunistic."</p><br><em><a target="_blank" href="https://www.cambridge.org/gb/universitypress/subjects/history/global-history/ecological-imperialism-biological-expansion-europe-9001900-2nd-edition?__cf_chl_f_tk=BTT8oYdLPfueDhs91._vvAqs05GtOh8bMOkp7mFaByU-1783200465-1.0.1.1-iUNdZFKukKM9x9mnKSyAvjwQWDZQlZPgpiIM_i2bpc0">Ecological Imperialism: The Biological Expansion of Europe, 900–1900 (Second Edition) by Alfred W. Crosby </a></em>',
    '<img id=\'light-box-image\' src=\'./images/bee.png\'><figcaption>bees from my community hive</figcaption><p>"Old World livestock prospered in the Neo-Europes. In fact, they did amazingly better in the Neo-Europes than in their homelands - a paradox. Let us examine the story of what might be described as the Neo-Europes\' only domesticated insect, the honeybee...The first honeybees brought to North America arrived in Virginia in the early 1620s, where honey became a common food in the seventeenth century. In Massachusetts, bees came ashore no later than the 1640s, and by 1663 they were thriving \'exceedingly,\' according to John Josselyn. The immigrant insects did as well as or better than the Europeans themselves in seventeenth-century British America…..They were naturalized in the seaboard colonies in the seventeenth century and widespread there by 1800"</p><br><em><a target="_blank" href="https://www.cambridge.org/gb/universitypress/subjects/history/global-history/ecological-imperialism-biological-expansion-europe-9001900-2nd-edition?__cf_chl_f_tk=BTT8oYdLPfueDhs91._vvAqs05GtOh8bMOkp7mFaByU-1783200465-1.0.1.1-iUNdZFKukKM9x9mnKSyAvjwQWDZQlZPgpiIM_i2bpc0">Ecological Imperialism: The Biological Expansion of Europe, 900–1900 (Second Edition) by Alfred W. Crosby </a></em>',
    '<img id=\'light-box-image\' src=\'./images/baby_bugs.png\'><p>"How can I, child of immigrants, with a long cultural history of colonial extirpation behind me, object to the presence of other invasives, I wonder, as I walk the park’s wooded landscape. Aren’t humans apex invasives, triumphant at eliminating other species and creating monocultures? What I’m trying to figure out is how, in these days of mounting ecological loss, I can love and care for land that isn’t mine, land that I’ve inhabited for years yet where I have no personal ancestry, land historically stolen from its Indigenous inhabitants, which has nevertheless become my microclimate....Part of me wants to turn the proliferating wild parsnip into an enemy, a malignancy to be eradicated. But this means ignoring our metaphoric likenesses, our inextricable connectedness, which is hardly anthropomorphism. To recognize the plant’s invasiveness truthfully, I need to acknowledge past and ongoing human invasiveness, our own species’ cancerous propensity for unfettered growth.   What I desire, I tell myself, is not control but the agency to engage in acts of repair."</p><br><em><a target="_blank" href="https://emergencemagazine.org/essay/invasives/">Invasives: Unknitting Despair in a Tangled Landscape by Catherine Bush </a></em>',
    '<p>"Indeed, many of the species that people think of as native are actually alien. For instance, in the United States, the ring-necked pheasant, the state bird of South Dakota, is not native to the great plains of North America but was introduced from Asia as a game bird in the latter half of the nineteenth century....In Pennsylvania, more non-native honeysuckles mean more native bird species. Also the seed dispersal of native berry-producing plants is higher in places where non-native honey- suckles are most abundant...Nearly two centuries on from the introduction of the concept of native- ness, it is time for conservationists to focus much more on the functions of species, and much less on where they originated."</p><br><em><a target="_blank" href="https://www.nature.com/articles/474153a">Don\'t Judge a Species on Its Origins, Mark A. Davis, Matthew K. Chew, Richard J. Hobbs and others </a></em>',
    '<p>"Differentiating between native and alien assemblages of species is not possible using objective, ahistorical criteria (Peretti, 1998; Poe & Latella, 2018). Consequently, no species is intrinsically alien or native but only in relation to a particular area at a particular time, such that the spatial and temporal boundaries of that space can be – and are – constructed in many different ways (Boonman-Berson et al., 2014; Humair et al., 2014; Warren, 2007). In particular, the temporal threshold of nativeness varies widely between nations, with the date of European colonization often selected as a convenient but arbitrary ‘year zero’ (Head, 2012, 2017; Qvenild, 2014)."</p><br><em><a target="_blank" href="https://www.tandfonline.com/doi/epdf/10.1080/21550085.2021.1961200?needAccess=true&role=button">Beyond ‘Native V. Alien’: Critiques of the Native/alienParadigm in the Anthropocene, and Their Implications Charles R. Warren</a></em>',
    '<p>"In particular, when alien species are valued for economic and/or cultural reasons, exceptions are frequently made to welcome and even cherish them, so that introduced species have become integral to human welfare throughout the world....The value and usefulness of a framework which is so pervasively superseded by other considerations must be questioned, especially when historical and cross-cultural perspec-tives show how changeable and varied social perceptions of ‘good nature’ are. Species lauded by one generation or society may be targeted for eradication by another, and the ‘pests’ of one era may rapidly morph into cherished conservation icons in the next (Smout, 2011)....There is thus no single, unchanging ‘truth’ about which species are desirable and undesirable (Thomas, 2017). Even within today’s scientific community, normative views concerning the value and treatment of alien species vary considerably "</p><br><em><a target="_blank" href="https://www.tandfonline.com/doi/epdf/10.1080/21550085.2021.1961200?needAccess=true&role=button">Beyond ‘Native V. Alien’: Critiques of the Native/alienParadigm in the Anthropocene, and Their Implications Charles R. Warren</a></em>',
    '<p>"In environmental discourses, human and biotic communities are conflated in myriad ways, especially in relation to the intertwined and co-rooted ideas of nature, native and nation (Head & Muir, 2004; Smith, 2011; Warren, 2011).....Explicit comparisons between ‘foreign’ species and ‘othered’ humans are not only commonplace but have become integral to biopolitical governance, exemplified by President Bush’s relocation of staff responsible for invasive species management to the Department for Homeland Security after the 9/11 attacks on the USA (Steer, 2015) and Australia’s ‘Safeguarding Australia’ policy which aims to protect the nation from terrorism, crime, invasive diseases and pests (Caluya, 2014). Branding invasive species as security threats to the ‘pure’ homeland (e.g. Simberloff et al., 2020) reinforces the nativist foreigner-as-threat imagery which pervades the invasion biology literature (Fall, 2014b; Katz, 2014; O’Brien, 2006; Subramaniam, 2017). "</p><br><em><a target="_blank" href="https://www.tandfonline.com/doi/epdf/10.1080/21550085.2021.1961200?needAccess=true&role=button">Beyond ‘Native V. Alien’: Critiques of the Native/alienParadigm in the Anthropocene, and Their Implications Charles R. Warren</a></em>',
    '<img id=\'light-box-image\' src=\'./images/tree.png\'><p>"Yes, nature is carefully managed national parks and vast boreal forest and uninhabited arctic. Nature is also the birds in your backyard; the bees whizzing down Fifth Avenue in Manhattan; the pines in rows in forest plantations; the blackberries and butterfly bushes that grow alongside the urban river; the Chinese tree-of-heaven or "ghetto palm" growing behind the corner store; the quail strutting through the farmer\'s field; the old field overgrown with weeds and shrubs and snakes and burrowing mammals; the jungle thick with plants labeled "invasive" pests; the carefully designed landscape garden; the green roof; the highway median; the five-hundred-year-old orchard folded into the heart of the Amazon; the avocado tree that sprouts in your compost pile."</p><br><em><a target="_blank" href="https://www.bloomsbury.com/us/rambunctious-garden-9781608194544/">Rambunctious Garden: Saving Nature in a Post-Wild World by Emma Marris </a></em>',
    '<p>"Every ecosystem, from the deepest heart of the largest national park to the weeds growing behind the local big box store, has been touched by humans. We have stirred the global pot, moved species around, turned up the thermometer, domesticated a handful of plants and animals, and driven extinct many more."</p><br><em><a target="_blank" href="https://www.bloomsbury.com/us/rambunctious-garden-9781608194544/">Rambunctious Garden: Saving Nature in a Post-Wild World by Emma Marris </a></em>',
    '<p>"The faith that native ecosystems are better than changed ecosystems is so pervasive in fields like ecology that it has become an unquestionable assumption….. The cult of pristine wilderness is a cultural construction,  and a relatively new one. It was born, like so many new creeds, in America....America perfected and exported the \'Yellowstone Model,\' based on setting aside pristine wilderness areas and banning all human use therein, apart from tourism....Parks located on more fertile, flat and workable land have another problem: people often were already living there when the protected area was created. And because the Yellowstone model requires \'untouched\' nature, the people were often kicked out. Both Yosemite and Yellowstone were populated before they were parks. Yosemite Valley was the on-and-off home of the Miwok Indians, a group of whom were expelled to make way for gold miners in 1851 by the "mariposa battalion" under the authority of the Mariposa County sheriff. But they didn\'t stay out. Later Muir himself called for the expulsion of all Indians from Yosemite National Park. A few lived in the park in the early decades of the twentieth century, on display, in an "Indian Village." The last family left in 1969. In Yellowstone, an initial agreement to let Indians stay was called off in 1877, and the area\'s residents were forcibly removed....According to journalist Mark Dowie, about half of the Earth\'s protected areas were \'either occupied or regularly used by indigenous peoples." Millions of people have been moved in the last century to protect nature, but the irony is that they were doing the least harm-- after all, that is why their land had sufficient nature to interest conservationists in the first place."</p><br><em><a target="_blank" href="https://www.bloomsbury.com/us/rambunctious-garden-9781608194544/">Rambunctious Garden: Saving Nature in a Post-Wild World by Emma Marris </a></em>',
    '<p>"There are changes all the time in ecosystems, directional and stochastic," says (ecologist Ken) Aho. "You can\'t become attached to one particular snapshot. Part of the beauty of ecology is its change."</p><br><em><a target="_blank" href="https://www.bloomsbury.com/us/rambunctious-garden-9781608194544/">Rambunctious Garden: Saving Nature in a Post-Wild World by Emma Marris </a></em>',
    '<p>"Killing a <em>who<em> demands something different than killing an <em>it</em>"</p><br><em><a target="_blank" href="https://milkweed.org/book/braiding-sweetgrass">Braiding Sweetgrass by Robin Wall Kimmerer </a></em>',
    '<img id=\'light-box-image\' src=\'./images/betty.png\'><p>"There\'s a tree that grows in Brooklyn. Some people call it the Tree of Heaven. No matter where its seed falls, it makes a tree which struggles to reach the sky. It grows in boarded-up lots and out of neglected rubbish heaps. It grows up out of cellar gratings. It is the only tree that grows out of cement. It grows lushly . . . survives without sun, water, and seemingly without earth. It would be considered beautiful except that there are too many of it."</p><br><em>A Tree Grows in Brooklyn by Betty Smith</em>',
    '<p>""In indigenous ways of knowing, it is understood that each living being has a particular role to play. Every being is endowed with certain gifts, its own intelligence, its own spirit, its own story."</p><br><em>Gathering Moss by Robin Wall Kimmerer</em>',
    '<img id=\'light-box-image\' src=\'./images/45dollar.jpg\'><figcaption>Continental Congress of Philadelphia put the image of a bee skep on their 45 dollar bill</figcaption><p>"\'If the Lord delights in us, then He will bring us into this land. . . a land which flows with milk and honey.\'—Numbers 14:8<br>"European settlers often quoted this biblical phrase to justify their colonization efforts. As long as settlers had cattle and bees, they could be assured of the basic essentials—food, wax, medicine, candles, and clothing. So powerful was the Bible verse that even though cattle and honey bees did not exist in North America, colonizers envisioned the New World as having them in the immediate future."</p><br><em><a target="_blank" href="https://www.jstor.org/stable/j.ctt2jcqvq.3">Bees in America by Tammy Horn</a></em>',
    '<p>"“The more shipping we do, and the more connections we make, the more potential we create for the spread of species” says Verna. Canadian researchers made the same point in 2019, when they predicted a global surge in invasive species by mid-century, caused by projected increases in overseas commerce. Added to that, climate change and the global shipping glut tied to the pandemic can also benefit new introductions."<br></p><br><em><a target="_blank" href="https://therevelator.org/cargo-invasive-species/">Cargo, With a Side of Hornets, Flies and Crabs: Global shipping is moving invasive species around the world. Can world governments agree on necessary preventative measures? by Tim Lydon</a></em>',
    '<p>"At any point during these journeys, native species can latch onto items or their packaging and wind up on the deck of a ship headed for another continent. The ship itself can also be a host, especially for marine species. It’s a daunting array of vectors, but as Verna has learned, some paths are better traveled than others." <br></p><br><em><a target="_blank" href="https://therevelator.org/cargo-invasive-species/">Cargo, With a Side of Hornets, Flies and Crabs: Global shipping is moving invasive species around the world. Can world governments agree on necessary preventative measures? by Tim Lydon</a></em>',
    '<p>"Ships have moved species about the world for ages. Researchers believe that in the 1840s a strain of the pathogen Phytophthora infestans, which causes potato blight, followed trade routes from Mexico to Belgium, where it began damaging crops." <br></p><br><em><a target="_blank" href="https://therevelator.org/cargo-invasive-species/">Cargo, With a Side of Hornets, Flies and Crabs: Global shipping is moving invasive species around the world. Can world governments agree on necessary preventative measures? by Tim Lydon</a></em>',
    '<img id=\'light-box-image\' src=\'./images/doom_bloom.png\'><figcaption>Doom Bloom by Philadelphia Bee Company</figcaption><p>"Spotted Lanternfly (SLF) honey is a novel U.S.-based honey first identified in Pennsylvania in 2014. Beekeepers observed unusually dark honey containing tree-of-heaven sap and lanternfly honeydew....56.6% of SLF [Spotted Lanternfly] samples (43 samples out of 76) have a ZOI greater than 16mm suggesting that the majority of SLF honeys exhibit strong antibacterialactivity against S. aureus that is comparable to or greater than Manukahoney, indicating their potential use in future medical applications for the prevention and treatment of S. aureus-associated infections. " <br></p><br><em><a target="_blank" href="https://sciences.utsa.edu/student-programs/honey/_documents/posters/2025/slf-honey-as-strong-candidate-for-us-based-medical-grade-honey.pdf">Spotted Lanternfly (SLF) Honey as a Strong Candidate for U.S. Based Medical-Grade Honey by Zeynep Dulkadir, Natalia Castillo, Alia Elkhalili, Robyn Underwood, Ferhat Ozturk</a></em>',
    '<p>"Some researchers, beekeepers and journalists have argued that migratory beekeeping is one of the primary reasons that so many bees die each winter as well as an explanation for colony collapse disorder (CCD)—the sudden and mysterious disappearance of an entire hive\'s residents, save for the queen and a few stragglers. Bringing so many bees together all at once in Central Valley and other flowering sites guarantees that they will spread viruses, mites and fungi to one another as they collide midair and crawl over each other in the hives. Forcing bees to gather pollen and nectar from vast swaths of a single crop deprives them of the far more diverse and nourishing diet provided by wild habitats. The migration also continually boomerangs honeybees between times of plenty and borderline starvation. Once a particular bloom is over, the bees have nothing to eat, because there is only that one pollen-depleted crop as far as the eye can see. When on the road, bees cannot forage or defecate. And the sugar syrup and pollen patties beekeepers offer as compensation are not nearly as nutritious as pollen and nectar from wild plants." <br></p><br><em><a target="_blank" href="https://www.scientificamerican.com/article/migratory-beekeeping-mind-boggling-math/">The Mind-Boggling Math of Migratory Beekeeping: 31 billion honeybees plus 810,000 acres of almond trees equals 700 billion almonds—and one looming agricultural crisis by Ferris Jabr</a></em>',
    '<p>"\Indeed, the overall concept of the "native" has some fundamental problems. It derives from precisely that frozen-in-time idea of "ecosystem integrity" that, as we\'ve seen, is riddled with conceptual shortcomings. Ecologists have spent decades assigning "native ranges" to species, usually based on where they were when the first white scientist showed up to take notes. These ranges are pegged to an arbitrary point in time, a moment in the long evolutionary and geographical journey of a particular lineage....When humans move species, those new areas never count as part of the "native" range, because of the fallacious idea that humans aren\'t part of nature."</p><br><em><a target="_blank" href="https://emmamarris.com/books/wild-souls-freedom-and-flourishing-in-the-non-human-world/">Wild Souls: Freedom and Flourishing in the Non-Human World by Emma Marris </a></em>',
    '<p>"Even on casual observation, one can discover plants growing beside city buildings, along abandoned boulevards, by fences, in cracks of pavement, and, of course, in vacant lots. These plants—not planted or tended, ignored and mostly despised—are the "natural" vegetation of urban centers. These are hardy pioneer plants that strive to gain a foothold whenever there are suitable environmental conditions. Plants growing voluntarily in these disturbed sites are commonly called weeds. The term weed has varying definitions but usually refers to "pest" plants that compete with other, cultivated plants. A more appropriate term for plants that voluntarily colonize disturbed and waste areas is ruderal plants. This category includes both alien and native species found on these disturbed sites and does not have pejorative implications for the esthetic or economic worth of the plants."<br></p><br><em><a target="_blank" href="https://www.jstor.org/stable/jj.8501160?turn_away=true">Natural History of Vacant Lots by Matthew F. Vessel and Herbert H. Wong</a></em>',
    '<img id=\'light-box-image\' src=\'./images/ailanthus_touch.png\'><p>"Ailanthus came to America via England. William Hamilton of Philadelphia was the first person who introduced ailanthus to his garden in 1784. The rapid and luxuriant growth of the plant and its power to thrive in unfavorable situations of poor soil and little care attracted the early settlers. In the 1820\'s the demand for small trees was handled by Prince and Parsons Nurseries of Flushing, Long Island, New York. Ailanthus was gradually planted in industrial centers such as New York City, Brooklyn, Baltimore, and Boston because of its ability to tolerate the dirt and smoke of cities....In America, ailanthus has been grown for nearly two hundred years; first with enthusiastic praise, and then in undue neglect. Under such abnormal conditions, ailanthus has failed to offer the American people its best qualities. At one time, ailanthus was planted widely, sometimes in areas where it did not have the capacity to thrive. It failed in the afforestation of the plateaus and the high plains of the Great Plains region in the United States. By neglect it spread without check and became weedy in cities of the less dry areas of America. In 1961, Edgar Anderson used the phrase "Ailanthus ... a blessing and a curse." It is true that through wise use ailanthus can be a blessing to the people, and by neglect it can be a curse. If American people want to have the benefit of ailanthus, they must be aware of its merits and shortcomings." <br></p><br><em><a target="_blank" href="https://www.jstor.org/stable/42954660">Ailanthus by Shiu Ying Hu</a></em>',
    '<p>"In China the history of Ailanthus is as old as the written language of the country...When a disappointed father scolds a spoiled son, or a critical teacher writes about an irresponsible youth, he uses ch\'un-ts\'ai, which means literally "the good-for-nothing ailanthus stump sprout." Ailanthus stump sprout is used as a metaphor for a youth who is not bound to obligations. This is due to the writings of Chuang-tsu, a Taoist philosopher and writer of 300 B.C. who described a large tree with a crooked, enlarged base that produced wood unsuitable for the rulers and compasses of carpentry. Ancient scholars after him interpreted this to refer to ailanthus, and used it as a metaphor for delinquent youths who follow no rules and customs...Practitioners of traditional Chinese medicine credit ailanthus bark with cooling and astringent properties, and regard it as beneficial for eliminating the physiological condition termed "damp-heat."" <br></p><br><em><a target="_blank" href="https://www.jstor.org/stable/42954660">Ailanthus by Shiu Ying Hu</a></em>',
    '<img id=\'light-box-image\' src=\'./images/essay/ailanthus_dog.png\'><p>"The history of the tree-of-heaven since its introduction into cultivation is a convoluted one. Once highly praised and widely planted as an ornamental, the species has made itself at home as a weed along our roadsides and in our fields. Ailanthus is now viewed by many as a symbol of dereliction and abandonment, but its hardiness also makes it deserving of our admiration....row. The ancient Chinese name for the plant is "God\'s tree," and in its native range it is planted near Buddhist temples. The name of the genus derives from its common East Indian name, Aylanto, meaning "heaven-tree" or "tree reaching for the sky." The English name, "tree-of-heaven," transposes the original meaning, which probably alludes to the East Indian mythic tree that reaches the heavens from the earth. During its days of respectability in the United States - the first half of the nineteenth century - tree-of-heaven was valued primarily for its ability to provide shade and to make an effect in the landscape within a relatively short time, growing up to five feet in a year. It happily grows in any soil condition and can be propagated in large numbers, both because of its tendency to sucker and because its distinctive winged seeds germinate easily without pretreatment. (In a moist medium, seedlings appear within two months.) It had the additional attraction of being a foreign plant that, as Andrew Jackson Downing so poetically put it, could "whisper tales to you in the evening of the \'Flowery Country\' from whence you have borrowed it."" <br></p><br><em><a target="_blank" href="https://www.jstor.org/stable/42954525">The Checkered Career of Ailanthus altissima by Behula Shah</a></em>',
    '<img id=\'light-box-image\' src=\'./images/essay/medica.jpg\'><figcaption>Page from the Bencao Gangmu (Compendium of Materia Medica) showing Spotted Lanternflies</figcaption><p>"The crimson lady is a pretty and medium-sized fulgorid.... The insect is generally better known in Chinese literature under the classical name, huechy (Ailanthus fowl)....It was first mentioned in the Herbal where it was classified with the cicada as a drug of medium virtue. Since then it is found practically in most of the Chinese materia medica....Outside medicine, the only case known to the present writer is the interest shown in them by children in Shiangcheng-shien, Honan, not far from Hankow. Here the children would place the insect on its back, put some coarse sand on its breast, and watch it turning the sand around with its legs. This acrobatic performance sometimes is turned also into a competitive game among the participants." <br></p><br><em><a target="_blank" href="https://www.jstor.org/stable/301853">Cicadas in Chinese Culture (Including the Silver-Fish) by Gaines Kan-Chih Liu</a></em>',
    '<p>"I engage with myself as a murderer, with the beautiful and harrowing juxtaposition of bringing death and life with the same hands within a matter of moments. By doing this, I try my hardest to never allow violence to be thoughtless and easy."</p><br><em>">An attempt to kill: what insects teach us about surviving genocides" <br></p><br><em>"An attempt to kill: what insects teach us about surviving genocides” by Dipaali Aragonda</em>',
    '<img id=\'light-box-image\' src=\'./images/poster.png\'><figcaption>Poster seen at my place of work.</figcaption><p>"The spotted lanternfly rhetoric was less explicitly racist than Trump’s COVID-19 “kung-flu,” but the discourse buzzing around the insect relied on similar metaphors: declarations of war against foreign invaders. These are metaphors preoccupied with boundaries—who and what a community or nation lets in and who and what they keep out—that draw from histories laced with racism, xenophobia, and nativism."</p><br><em>"“Stop This Invader!”—The War on Spotted Lanternflies" by Stephanie Palazzo</em>'


];




// shuffle STAR_TEXTS in-place (Fisher–Yates) so stars show randomized texts
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

STAR_TEXTS = shuffleArray(STAR_TEXTS);

let modelCanvas;
let mainCanvas;
let statusMsg;
let clearBtn;
let clickCounter = 0;

let baseFullRes = null;      // continuous-tone pix2pix output, captured once
let ditheredResult = null;   // current dithered frame, re-generated on a timer from baseFullRes
let stars = [];
let isModelLoaded = false;
let isTransferring = false;
let hasTransferred = false;  // guards the one-time transfer
let readyForTransfer = false; // set true the instant clickCounter hits instructionNumber
let pix2pix;

// --- Reusable buffers -------------------------------------------------
// The old code called createGraphics() and `new Float32Array(...)` inside
// regenerateDither()/ditherFloydSteinbergBW() on EVERY regen tick (5x/sec).
// Each of those allocations is a full-resolution offscreen canvas / typed
// array that gets thrown away a fraction of a second later. On mobile
// browsers (Safari in particular) that churn of large canvas allocations
// is the main driver of runaway memory and jank. We allocate these once
// and reuse them for the life of the sketch.
let regenBuffer = null;   // single persistent graphics buffer for regen ticks
let _grayCache = null;    // single persistent Float32Array for BW dithering

function getRandomIntInclusive(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
}

let instructionNumber = getRandomIntInclusive(15, 20);
let templateWings = document.querySelector("#template-wings");
let instructions = document.querySelector("#instructions");
if (instructions) instructions.innerHTML = "Click <b>" + instructionNumber + "</b> spots to continue.";
if (templateWings) templateWings.src = "./images/flies/fly" + getRandomIntInclusive(0, 299) + ".png";

function ditherFloydSteinberg(pg) {
  pg.loadPixels();
  let w = pg.width, h = pg.height;

  let r = new Float32Array(w * h);
  let g = new Float32Array(w * h);
  let b = new Float32Array(w * h);

  for (let i = 0; i < w * h; i++) {
    r[i] = pg.pixels[i * 4];
    g[i] = pg.pixels[i * 4 + 1];
    b[i] = pg.pixels[i * 4 + 2];
  }

  const levels = 4;
  const step = 255 / (levels - 1);

  function quantize(val) {
    return Math.round(Math.round(val / step) * step);
  }

  function clamp(val) {
    return Math.min(255, Math.max(0, val));
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let i = y * w + x;

      let oldR = r[i], oldG = g[i], oldB = b[i];
      let newR = quantize(oldR), newG = quantize(oldG), newB = quantize(oldB);

      r[i] = newR; g[i] = newG; b[i] = newB;

      let errR = oldR - newR;
      let errG = oldG - newG;
      let errB = oldB - newB;

      if (x + 1 < w) {
        r[i + 1] = clamp(r[i + 1] + errR * 7 / 16);
        g[i + 1] = clamp(g[i + 1] + errG * 7 / 16);
        b[i + 1] = clamp(b[i + 1] + errB * 7 / 16);
      }
      if (y + 1 < h) {
        if (x - 1 >= 0) {
          r[i + w - 1] = clamp(r[i + w - 1] + errR * 3 / 16);
          g[i + w - 1] = clamp(g[i + w - 1] + errG * 3 / 16);
          b[i + w - 1] = clamp(b[i + w - 1] + errB * 3 / 16);
        }
        r[i + w] = clamp(r[i + w] + errR * 5 / 16);
        g[i + w] = clamp(g[i + w] + errG * 5 / 16);
        b[i + w] = clamp(b[i + w] + errB * 5 / 16);
        if (x + 1 < w) {
          r[i + w + 1] = clamp(r[i + w + 1] + errR * 1 / 16);
          g[i + w + 1] = clamp(g[i + w + 1] + errG * 1 / 16);
          b[i + w + 1] = clamp(b[i + w + 1] + errB * 1 / 16);
        }
      }
    }
  }

  for (let i = 0; i < w * h; i++) {
    pg.pixels[i * 4] = r[i];
    pg.pixels[i * 4 + 1] = g[i];
    pg.pixels[i * 4 + 2] = b[i];
    pg.pixels[i * 4 + 3] = 255;
  }

  pg.updatePixels();
}

const BAYER_4x4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
].map(row => row.map(v => (v / 16) * 255));

function ditherFloydSteinbergBW(pg) {
  pg.loadPixels();
  const w = pg.width;
  const h = pg.height;

  // Reuse the same typed array across calls instead of allocating a new
  // one every regen tick -- this was the other big source of GC churn.
  if (!_grayCache || _grayCache.length !== w * h) {
    _grayCache = new Float32Array(w * h);
  }
  const gray = _grayCache;

  for (let i = 0; i < w * h; i += 1) {
    const offset = i * 4;
    const r = pg.pixels[offset];
    const g = pg.pixels[offset + 1];
    const b = pg.pixels[offset + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  for (let i = 0; i < gray.length; i += 1) {
    const v = gray[i] / 255;
    gray[i] = Math.pow(v, 2.8) * 200;
  }

  const clamp = value => Math.min(255, Math.max(0, value));

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const idx = y * w + x;
      const oldVal = gray[idx];
      const newVal = oldVal < 100 ? 0 : 150;
      gray[idx] = newVal;
      const err = oldVal - newVal;

      if (x + 1 < w) {
        gray[idx + 1] = clamp(gray[idx + 1] + err * 7 / 16);
      }
      if (y + 1 < h) {
        if (x - 1 >= 0) {
          gray[idx + w - 1] = clamp(gray[idx + w - 1] + err * 3 / 16);
        }
        gray[idx + w] = clamp(gray[idx + w] + err * 5 / 16);
        if (x + 1 < w) {
          gray[idx + w + 1] = clamp(gray[idx + w + 1] + err * 1 / 16);
        }
      }
    }
  }

  for (let i = 0; i < gray.length; i += 1) {
    const offset = i * 4;
    pg.pixels[offset] = gray[i];
    pg.pixels[offset + 1] = gray[i];
    pg.pixels[offset + 2] = gray[i];
    pg.pixels[offset + 3] = 255;
  }

  pg.updatePixels();
}

// Nudges every pixel's brightness by a small random amount. Run this on a
// copy of the base image right before dithering, and the resulting dither
// pattern comes out looking freshly "regenerated" even though the model
// never ran again.
function jitterPixels(pg, amount) {
  pg.loadPixels();
  for (let i = 0; i < pg.pixels.length; i += 4) {
    const n = (Math.random() * 2 - 1) * amount;
    pg.pixels[i] = constrain(pg.pixels[i] + n, 0, 255);
    pg.pixels[i + 1] = constrain(pg.pixels[i + 1] + n, 0, 255);
    pg.pixels[i + 2] = constrain(pg.pixels[i + 2] + n, 0, 255);
  }
  pg.updatePixels();
}

// Builds a new dithered frame from the single captured base image. Cheap
// enough to call every REGEN_INTERVAL_FRAMES frames — it's just noise +
// the same dither pass the sketch already had, no ML involved.
//
// IMPORTANT: reuses a single persistent `regenBuffer` graphics object
// instead of calling createGraphics() every tick. The old version created
// a brand new full-resolution offscreen canvas 5 times a second and threw
// it away -- that churn is what was driving memory usage up over time,
// especially on mobile browsers.
function regenerateDither() {
  if (!baseFullRes) return;

  const w = SIZE * SCALE;
  if (!regenBuffer) {
    regenBuffer = createGraphics(w, w);
    regenBuffer.pixelDensity(1);
  }

  regenBuffer.image(baseFullRes, 0, 0);
  jitterPixels(regenBuffer, REGEN_NOISE_AMOUNT);
  ditherFloydSteinbergBW(regenBuffer);

  ditheredResult = regenBuffer;
}

function setup() {
  pixelDensity(1);
  mainCanvas = createCanvas(SIZE * SCALE, SIZE * SCALE);
  mainCanvas.parent('output');

  // Cap the frame rate on mobile -- this sketch doesn't need 60fps to look
  // good, and a lower cap meaningfully cuts CPU/GPU (and battery/heat) use.
  if (isMobile) frameRate(30);

  modelCanvas = createGraphics(SIZE, SIZE);
  modelCanvas.pixelDensity(1);

  background(0);

  statusMsg = select('#status');
  clearBtn = select('#clearBtn');
  clearBtn.mousePressed(clearCanvas);
  saveBtn = select('#saveBtn');
  saveBtn.mousePressed(downloadCanvasAsImage);

  const closeBtn = document.querySelector('#close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const lightbox = document.querySelector('#light-box');
      if (lightbox) {
        lightbox.style.display = 'none';
        const contentDiv = lightbox.querySelector('#light-box-content-text');
        if (contentDiv) contentDiv.innerHTML = '';
      }
      // deselect any selected star when the lightbox is closed
      stars.forEach(star => star.selected = false);
    });
  }

  pix2pix = ml5.pix2pix('./model/flies.pict', modelLoaded);
}

function draw() {
  clear();
  updateStars();
  drawResult();
  drawConnections();
  drawStars();
  updateModelCanvas();

  if (clickCounter === 0) {
    ditheredResult = null;
    baseFullRes = null;
    hasTransferred = false;
    readyForTransfer = false;
    background(0);
  }

  // Fire the transfer exactly once, the moment we're ready and the model
  // is loaded. Everything after that is faked from the one result.
  if (readyForTransfer && isModelLoaded && !hasTransferred && !isTransferring) {
    hasTransferred = true;
    transfer();
  }

  // Fake the "still regenerating" look on an interval, purely from noise +
  // dither on the single captured base image — no more model calls.
  if (baseFullRes && frameCount % REGEN_INTERVAL_FRAMES === 0) {
    regenerateDither();
  }
}

function drawResult() {
  if (ditheredResult) {
    image(ditheredResult, 0, 0, SIZE * SCALE, SIZE * SCALE);
  }
}

function clearCanvas() {
  instructionNumber = getRandomIntInclusive(15, 20);
  if (instructions) instructions.innerHTML = "Click <b>" + instructionNumber + "</b> spots to continue.";
  if (templateWings) templateWings.src = "./images/flies/fly" + getRandomIntInclusive(0, 299) + ".png";
  if (templateWings) templateWings.classList.remove("fadeOut");

  // close lightbox if open and clear its content
  const lightbox = document.querySelector('#light-box');
  if (lightbox) {
    lightbox.style.display = 'none';
    const contentDiv = lightbox.querySelector('#light-box-content-text');
    if (contentDiv) contentDiv.innerHTML = '';
  }

  // reset canvas/state
  background(0);
  clickCounter = 0;
  stars.forEach(s => s.selected = false);
  stars = [];
  ditheredResult = null;
  baseFullRes = null;
  hasTransferred = false;
  readyForTransfer = false;
  background(0);
}

function drawConnections() {
  stroke(...STAR_COLOR);
  strokeWeight(1);

  stars.forEach(star => {
    star.connections.forEach(neighbor => {
      line(star.x, star.y, neighbor.x, neighbor.y);
    });
  });
}

function drawStars() {
  noStroke();
  fill(...STAR_COLOR);
  textAlign(CENTER, CENTER);

  stars.forEach(star => {
    if (clickCounter >= instructionNumber && star.selected) {
      textSize(50);
    } else {
      textSize(20);
    }
    text('✷', star.x, star.y);
  });
}

function updateModelCanvas() {
  modelCanvas.background(0);
  modelCanvas.noStroke();
  modelCanvas.fill(255);

  stars.forEach(star => {
    modelCanvas.ellipse(
      star.x / SCALE,
      star.y / SCALE,
      star.radius,
      star.radius
    );
  });
}

// Shared "select a star + open/close the lightbox" logic, used by both
// mouse and touch input. Previously this logic only existed inside
// mousePressed(), so touchStarted() (the handler that actually fires on
// mobile taps) never opened the lightbox at all.
function toggleStarAt(x, y) {
  let clickedIndex = null;

  stars.forEach((star, index) => {
    if (clickedIndex === null && dist(x, y, star.x, star.y) < 20) {
      clickedIndex = index;
    }
  });

  if (clickedIndex === null) return;

  const clickedStar = stars[clickedIndex];
  const willSelect = !clickedStar.selected;
  stars.forEach(star => star.selected = false);
  clickedStar.selected = willSelect;

  const lightbox = document.querySelector("#light-box");
  if (willSelect && lightbox && STAR_TEXTS[clickedIndex]) {
    const contentDiv = lightbox.querySelector("#light-box-content-text");
    if (contentDiv) {
      contentDiv.innerHTML = STAR_TEXTS[clickedIndex];
    }
    lightbox.style.display = "block";
  } else if (lightbox) {
    lightbox.style.display = "none";
  }
}

function mousePressed() {
  if (clickCounter >= instructionNumber) {
    toggleStarAt(mouseX, mouseY);
    return;
  }

  handlePointer(mouseX, mouseY);
}

function mouseDragged() {
  if (!inCanvasBounds(mouseX, mouseY)) return;
  if (clickCounter >= instructionNumber) return;

  const lastStar = stars[stars.length - 1];
  if (!lastStar || dist(mouseX, mouseY, lastStar.originX, lastStar.originY) > 25) {
    handlePointer(mouseX, mouseY);
  }
}

// p5 binds touchstart/touchmove listeners to the whole window (not just the
// canvas) so drags that start on the canvas keep tracking even if a finger
// slides off it. That means a tap on the lightbox's close button, or a
// scroll inside its text, also runs through these handlers -- and since
// they returned `false`, p5 called preventDefault() on the native event,
// which silently blocks the follow-up click on mobile and blocks native
// scrolling. The fix: if the touch isn't on the sketch canvas at all, just
// let the browser handle it normally.
function touchStarted(event) {
  if (event && event.target && mainCanvas && !mainCanvas.elt.contains(event.target)) {
    return true;
  }

  if (touches.length > 0) {
    // After all stars are placed, taps select a star and open the lightbox
    // (same behavior as mousePressed, via the shared toggleStarAt helper).
    if (clickCounter >= instructionNumber) {
      toggleStarAt(touches[0].x, touches[0].y);
      return false;
    }

    handlePointer(touches[0].x, touches[0].y);
  }
  return false;
}

function touchMoved(event) {
  if (event && event.target && mainCanvas && !mainCanvas.elt.contains(event.target)) {
    return true;
  }

  if (touches.length > 0) {
    handlePointer(touches[0].x, touches[0].y, true);
  }
  return false;
}

function handlePointer(x, y, isDrag = false) {
  if (!inCanvasBounds(x, y)) return;
  if (clickCounter >= instructionNumber) return;

  const star = new Star(x, y);
  clickCounter += 1;

  if (instructions) instructions.innerHTML = "Click <b>" + Math.max(0, instructionNumber - clickCounter) + "</b> spots to continue.";

  const closest = getClosestStar(x, y);
  if (closest && closest.distance < CONNECT_DISTANCE * (isDrag ? 1 : SCALE)) {
    star.connections.push(closest.star);
  }

  if (isDrag && stars.length > 0) {
    const prevStar = stars[stars.length - 1];
    if (dist(star.originX, star.originY, prevStar.originX, prevStar.originY) < CONNECT_DISTANCE) {
      star.connections.push(prevStar);
    }
  }

  stars.push(star);

  if (clickCounter === instructionNumber) {
    if (templateWings) templateWings.classList.add("fadeOut");
    if (instructions) instructions.innerHTML = "Click the stars to learn about the network";

    // Trigger the one-time transfer instead of an interval. draw() will
    // pick this up on the next frame once the model is ready.
    readyForTransfer = true;
  }
}

function inCanvasBounds(x, y) {
  return x >= 0 && x <= width && y >= 0 && y <= height;
}

function getClosestStar(x, y) {
  let closestStar = null;
  let recordDist = Infinity;

  stars.forEach(star => {
    const d = dist(x, y, star.originX, star.originY);
    if (d < recordDist) {
      recordDist = d;
      closestStar = star;
    }
  });

  return closestStar ? { star: closestStar, distance: recordDist } : null;
}

class Star {
  constructor(x, y) {
    this.originX = x;
    this.originY = y;
    this.selected = false;
    this.noiseOffsetX = random(0, 1000);
    this.noiseOffsetY = random(1000, 2000);
    this.radius = 5;
    this.driftRange = 0;
    this.connections = [];
    this.x = x;
    this.y = y;
  }

  update() {
    this.x = this.originX + map(noise(this.noiseOffsetX), 0, 1, -this.driftRange, this.driftRange);
    this.y = this.originY + map(noise(this.noiseOffsetY), 0, 1, -this.driftRange, this.driftRange);
    this.noiseOffsetX += 0.03;
    this.noiseOffsetY += 0.03;
    if (clickCounter >= instructionNumber) {
      this.driftRange = 0;
    }
  }
}

function modelLoaded() {
  statusMsg.html('Model Loaded!');
  isModelLoaded = true;
  // No more setInterval here — draw() now fires transfer() exactly once,
  // as soon as both readyForTransfer and isModelLoaded are true.
}

function transfer() {
  isTransferring = true;
  statusMsg.html('Transferring...');

  pix2pix.transfer(modelCanvas.elt, (err, result) => {
    isTransferring = false;

    if (err) {
      console.error(err);
      statusMsg.html('Error: Check Developer Console.');
      hasTransferred = false; // allow a retry on the next draw() frame
      return;
    }

    if (result?.src) {
      statusMsg.html('Done!');
      loadImage(result.src, p5img => {
        baseFullRes = createGraphics(SIZE * SCALE, SIZE * SCALE);
        baseFullRes.pixelDensity(1);
        baseFullRes.image(p5img, 0, 0, SIZE * SCALE, SIZE * SCALE);

        // Kick off the first dithered frame immediately; draw()'s interval
        // check takes over from here, faking regeneration every ~200ms.
        regenerateDither();
      });
    }
  });
}

function updateStars() {
  stars.forEach(star => star.update());
}

function downloadCanvasAsImage() {
  if (!ditheredResult) {
    statusMsg.html('No image available to download.');
    return;
  }
  saveCanvas(ditheredResult, 'microcosmos', 'png');
}