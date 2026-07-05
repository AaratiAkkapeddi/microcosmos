const SIZE = 256;
const SCALE = 4;
const CONNECT_DISTANCE = 60;
const STAR_COLOR = [236, 223, 172, 255];

// Instead of re-running pix2pix, we "fake" regeneration by jittering the
// continuous-tone base image with a little noise and re-dithering it on
// an interval. Same look as the old live transfer, none of the cost.
const REGEN_INTERVAL_FRAMES = 12; // ~200ms at 60fps, matching the old TRANSFER_INTERVAL_MS
const REGEN_NOISE_AMOUNT = 18;    // how much brightness jitter to add before re-dithering

const STAR_TEXTS = [
  "<img id='light-box-image' src='./images/test.png'><p>Ailanthus Altissima (a.k.a 臭椿, Tree of Heaven, Ghetto Palm, Stink Tree) is the preferred host species for the Spotted Lanternfly.  It was first brought to the United Kingdom from China in the 1740s as a failed attempt to establish silk production and then later introduced to the United States in 1784 as an ornamental. In China, Tree of Heaven is mentioned in the 本草 or Materia Medica for having curative and astringent properties. Tree of Heaven is considered invasive and has a storied cultural history in NYC, for example, as the primary metaphor in Betty Smith's 1943 novel, <em>A Tree Grows in Brooklyn.</em></p><ul><li>Battles, Matthew. 'Of Silk and Invasion.' Arnold Arboretum, July 20, 2022. <a href='https://arboretum.harvard.edu/stories/of-silk-and-invasion/'>https://arboretum.harvard.edu/stories/of-silk-and-invasion/</a></li><li>Hu, Shiu Ying. ;'Ailanthus.' Arnoldia 39, no. 2 (March/April 1979): 29–50. <a href='https://www.jstor.org/stable/42954660'>https://www.jstor.org/stable/42954660.</a></li><li>Smith, Betty. A Tree Grows in Brooklyn. New York: Harper & Brothers, 1943.</li><li>Tang Shenwei (唐慎微). <em>Chong xiu Zhenghe jing shi zheng lei bei yong ben cao</em> (重修政和經史證類備用本草). 1249. Internet Archive, p. 637. <a href='https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up?q=%E6%A8%97'>https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up</a></li></ul>",
  "<img id='light-box-image' src='./images/test.png'><p>Ailanthus Altissima (a.k.a 臭椿, Tree of Heaven, Ghetto Palm, Stink Tree) is the preferred host species for the Spotted Lanternfly.  It was first brought to the United Kingdom from China in the 1740s as a failed attempt to establish silk production and then later introduced to the United States in 1784 as an ornamental. In China, Tree of Heaven is mentioned in the 本草 or Materia Medica for having curative and astringent properties. Tree of Heaven is considered invasive and has a storied cultural history in NYC, for example, as the primary metaphor in Betty Smith's 1943 novel, <em>A Tree Grows in Brooklyn.</em></p><ul><li>Battles, Matthew. 'Of Silk and Invasion.' Arnold Arboretum, July 20, 2022. <a href='https://arboretum.harvard.edu/stories/of-silk-and-invasion/'>https://arboretum.harvard.edu/stories/of-silk-and-invasion/</a></li><li>Hu, Shiu Ying. ;'Ailanthus.' Arnoldia 39, no. 2 (March/April 1979): 29–50. <a href='https://www.jstor.org/stable/42954660'>https://www.jstor.org/stable/42954660.</a></li><li>Smith, Betty. A Tree Grows in Brooklyn. New York: Harper & Brothers, 1943.</li><li>Tang Shenwei (唐慎微). <em>Chong xiu Zhenghe jing shi zheng lei bei yong ben cao</em> (重修政和經史證類備用本草). 1249. Internet Archive, p. 637. <a href='https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up?q=%E6%A8%97'>https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up</a></li></ul>",
  "<img id='light-box-image' src='./images/test.png'><p>Ailanthus Altissima (a.k.a 臭椿, Tree of Heaven, Ghetto Palm, Stink Tree) is the preferred host species for the Spotted Lanternfly.  It was first brought to the United Kingdom from China in the 1740s as a failed attempt to establish silk production and then later introduced to the United States in 1784 as an ornamental. In China, Tree of Heaven is mentioned in the 本草 or Materia Medica for having curative and astringent properties. Tree of Heaven is considered invasive and has a storied cultural history in NYC, for example, as the primary metaphor in Betty Smith's 1943 novel, <em>A Tree Grows in Brooklyn.</em></p><ul><li>Battles, Matthew. 'Of Silk and Invasion.' Arnold Arboretum, July 20, 2022. <a href='https://arboretum.harvard.edu/stories/of-silk-and-invasion/'>https://arboretum.harvard.edu/stories/of-silk-and-invasion/</a></li><li>Hu, Shiu Ying. ;'Ailanthus.' Arnoldia 39, no. 2 (March/April 1979): 29–50. <a href='https://www.jstor.org/stable/42954660'>https://www.jstor.org/stable/42954660.</a></li><li>Smith, Betty. A Tree Grows in Brooklyn. New York: Harper & Brothers, 1943.</li><li>Tang Shenwei (唐慎微). <em>Chong xiu Zhenghe jing shi zheng lei bei yong ben cao</em> (重修政和經史證類備用本草). 1249. Internet Archive, p. 637. <a href='https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up?q=%E6%A8%97'>https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up</a></li></ul>",
  "<img id='light-box-image' src='./images/test.png'><p>Ailanthus Altissima (a.k.a 臭椿, Tree of Heaven, Ghetto Palm, Stink Tree) is the preferred host species for the Spotted Lanternfly.  It was first brought to the United Kingdom from China in the 1740s as a failed attempt to establish silk production and then later introduced to the United States in 1784 as an ornamental. In China, Tree of Heaven is mentioned in the 本草 or Materia Medica for having curative and astringent properties. Tree of Heaven is considered invasive and has a storied cultural history in NYC, for example, as the primary metaphor in Betty Smith's 1943 novel, <em>A Tree Grows in Brooklyn.</em></p><ul><li>Battles, Matthew. 'Of Silk and Invasion.' Arnold Arboretum, July 20, 2022. <a href='https://arboretum.harvard.edu/stories/of-silk-and-invasion/'>https://arboretum.harvard.edu/stories/of-silk-and-invasion/</a></li><li>Hu, Shiu Ying. ;'Ailanthus.' Arnoldia 39, no. 2 (March/April 1979): 29–50. <a href='https://www.jstor.org/stable/42954660'>https://www.jstor.org/stable/42954660.</a></li><li>Smith, Betty. A Tree Grows in Brooklyn. New York: Harper & Brothers, 1943.</li><li>Tang Shenwei (唐慎微). <em>Chong xiu Zhenghe jing shi zheng lei bei yong ben cao</em> (重修政和經史證類備用本草). 1249. Internet Archive, p. 637. <a href='https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up?q=%E6%A8%97'>https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up</a></li></ul>",
  "<img id='light-box-image' src='./images/test.png'><p>Ailanthus Altissima (a.k.a 臭椿, Tree of Heaven, Ghetto Palm, Stink Tree) is the preferred host species for the Spotted Lanternfly.  It was first brought to the United Kingdom from China in the 1740s as a failed attempt to establish silk production and then later introduced to the United States in 1784 as an ornamental. In China, Tree of Heaven is mentioned in the 本草 or Materia Medica for having curative and astringent properties. Tree of Heaven is considered invasive and has a storied cultural history in NYC, for example, as the primary metaphor in Betty Smith's 1943 novel, <em>A Tree Grows in Brooklyn.</em></p><ul><li>Battles, Matthew. 'Of Silk and Invasion.' Arnold Arboretum, July 20, 2022. <a href='https://arboretum.harvard.edu/stories/of-silk-and-invasion/'>https://arboretum.harvard.edu/stories/of-silk-and-invasion/</a></li><li>Hu, Shiu Ying. ;'Ailanthus.' Arnoldia 39, no. 2 (March/April 1979): 29–50. <a href='https://www.jstor.org/stable/42954660'>https://www.jstor.org/stable/42954660.</a></li><li>Smith, Betty. A Tree Grows in Brooklyn. New York: Harper & Brothers, 1943.</li><li>Tang Shenwei (唐慎微). <em>Chong xiu Zhenghe jing shi zheng lei bei yong ben cao</em> (重修政和經史證類備用本草). 1249. Internet Archive, p. 637. <a href='https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up?q=%E6%A8%97'>https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up</a></li></ul>",
    "<img id='light-box-image' src='./images/test.png'><p>Ailanthus Altissima (a.k.a 臭椿, Tree of Heaven, Ghetto Palm, Stink Tree) is the preferred host species for the Spotted Lanternfly.  It was first brought to the United Kingdom from China in the 1740s as a failed attempt to establish silk production and then later introduced to the United States in 1784 as an ornamental. In China, Tree of Heaven is mentioned in the 本草 or Materia Medica for having curative and astringent properties. Tree of Heaven is considered invasive and has a storied cultural history in NYC, for example, as the primary metaphor in Betty Smith's 1943 novel, <em>A Tree Grows in Brooklyn.</em></p><ul><li>Battles, Matthew. 'Of Silk and Invasion.' Arnold Arboretum, July 20, 2022. <a href='https://arboretum.harvard.edu/stories/of-silk-and-invasion/'>https://arboretum.harvard.edu/stories/of-silk-and-invasion/</a></li><li>Hu, Shiu Ying. ;'Ailanthus.' Arnoldia 39, no. 2 (March/April 1979): 29–50. <a href='https://www.jstor.org/stable/42954660'>https://www.jstor.org/stable/42954660.</a></li><li>Smith, Betty. A Tree Grows in Brooklyn. New York: Harper & Brothers, 1943.</li><li>Tang Shenwei (唐慎微). <em>Chong xiu Zhenghe jing shi zheng lei bei yong ben cao</em> (重修政和經史證類備用本草). 1249. Internet Archive, p. 637. <a href='https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up?q=%E6%A8%97'>https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up</a></li></ul>",
  "<img id='light-box-image' src='./images/test.png'><p>Ailanthus Altissima (a.k.a 臭椿, Tree of Heaven, Ghetto Palm, Stink Tree) is the preferred host species for the Spotted Lanternfly.  It was first brought to the United Kingdom from China in the 1740s as a failed attempt to establish silk production and then later introduced to the United States in 1784 as an ornamental. In China, Tree of Heaven is mentioned in the 本草 or Materia Medica for having curative and astringent properties. Tree of Heaven is considered invasive and has a storied cultural history in NYC, for example, as the primary metaphor in Betty Smith's 1943 novel, <em>A Tree Grows in Brooklyn.</em></p><ul><li>Battles, Matthew. 'Of Silk and Invasion.' Arnold Arboretum, July 20, 2022. <a href='https://arboretum.harvard.edu/stories/of-silk-and-invasion/'>https://arboretum.harvard.edu/stories/of-silk-and-invasion/</a></li><li>Hu, Shiu Ying. ;'Ailanthus.' Arnoldia 39, no. 2 (March/April 1979): 29–50. <a href='https://www.jstor.org/stable/42954660'>https://www.jstor.org/stable/42954660.</a></li><li>Smith, Betty. A Tree Grows in Brooklyn. New York: Harper & Brothers, 1943.</li><li>Tang Shenwei (唐慎微). <em>Chong xiu Zhenghe jing shi zheng lei bei yong ben cao</em> (重修政和經史證類備用本草). 1249. Internet Archive, p. 637. <a href='https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up?q=%E6%A8%97'>https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up</a></li></ul>",
  "<img id='light-box-image' src='./images/test.png'><p>Ailanthus Altissima (a.k.a 臭椿, Tree of Heaven, Ghetto Palm, Stink Tree) is the preferred host species for the Spotted Lanternfly.  It was first brought to the United Kingdom from China in the 1740s as a failed attempt to establish silk production and then later introduced to the United States in 1784 as an ornamental. In China, Tree of Heaven is mentioned in the 本草 or Materia Medica for having curative and astringent properties. Tree of Heaven is considered invasive and has a storied cultural history in NYC, for example, as the primary metaphor in Betty Smith's 1943 novel, <em>A Tree Grows in Brooklyn.</em></p><ul><li>Battles, Matthew. 'Of Silk and Invasion.' Arnold Arboretum, July 20, 2022. <a href='https://arboretum.harvard.edu/stories/of-silk-and-invasion/'>https://arboretum.harvard.edu/stories/of-silk-and-invasion/</a></li><li>Hu, Shiu Ying. ;'Ailanthus.' Arnoldia 39, no. 2 (March/April 1979): 29–50. <a href='https://www.jstor.org/stable/42954660'>https://www.jstor.org/stable/42954660.</a></li><li>Smith, Betty. A Tree Grows in Brooklyn. New York: Harper & Brothers, 1943.</li><li>Tang Shenwei (唐慎微). <em>Chong xiu Zhenghe jing shi zheng lei bei yong ben cao</em> (重修政和經史證類備用本草). 1249. Internet Archive, p. 637. <a href='https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up?q=%E6%A8%97'>https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up</a></li></ul>",
  "<img id='light-box-image' src='./images/test.png'><p>Ailanthus Altissima (a.k.a 臭椿, Tree of Heaven, Ghetto Palm, Stink Tree) is the preferred host species for the Spotted Lanternfly.  It was first brought to the United Kingdom from China in the 1740s as a failed attempt to establish silk production and then later introduced to the United States in 1784 as an ornamental. In China, Tree of Heaven is mentioned in the 本草 or Materia Medica for having curative and astringent properties. Tree of Heaven is considered invasive and has a storied cultural history in NYC, for example, as the primary metaphor in Betty Smith's 1943 novel, <em>A Tree Grows in Brooklyn.</em></p><ul><li>Battles, Matthew. 'Of Silk and Invasion.' Arnold Arboretum, July 20, 2022. <a href='https://arboretum.harvard.edu/stories/of-silk-and-invasion/'>https://arboretum.harvard.edu/stories/of-silk-and-invasion/</a></li><li>Hu, Shiu Ying. ;'Ailanthus.' Arnoldia 39, no. 2 (March/April 1979): 29–50. <a href='https://www.jstor.org/stable/42954660'>https://www.jstor.org/stable/42954660.</a></li><li>Smith, Betty. A Tree Grows in Brooklyn. New York: Harper & Brothers, 1943.</li><li>Tang Shenwei (唐慎微). <em>Chong xiu Zhenghe jing shi zheng lei bei yong ben cao</em> (重修政和經史證類備用本草). 1249. Internet Archive, p. 637. <a href='https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up?q=%E6%A8%97'>https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up</a></li></ul>",
  "<img id='light-box-image' src='./images/test.png'><p>Ailanthus Altissima (a.k.a 臭椿, Tree of Heaven, Ghetto Palm, Stink Tree) is the preferred host species for the Spotted Lanternfly.  It was first brought to the United Kingdom from China in the 1740s as a failed attempt to establish silk production and then later introduced to the United States in 1784 as an ornamental. In China, Tree of Heaven is mentioned in the 本草 or Materia Medica for having curative and astringent properties. Tree of Heaven is considered invasive and has a storied cultural history in NYC, for example, as the primary metaphor in Betty Smith's 1943 novel, <em>A Tree Grows in Brooklyn.</em></p><ul><li>Battles, Matthew. 'Of Silk and Invasion.' Arnold Arboretum, July 20, 2022. <a href='https://arboretum.harvard.edu/stories/of-silk-and-invasion/'>https://arboretum.harvard.edu/stories/of-silk-and-invasion/</a></li><li>Hu, Shiu Ying. ;'Ailanthus.' Arnoldia 39, no. 2 (March/April 1979): 29–50. <a href='https://www.jstor.org/stable/42954660'>https://www.jstor.org/stable/42954660.</a></li><li>Smith, Betty. A Tree Grows in Brooklyn. New York: Harper & Brothers, 1943.</li><li>Tang Shenwei (唐慎微). <em>Chong xiu Zhenghe jing shi zheng lei bei yong ben cao</em> (重修政和經史證類備用本草). 1249. Internet Archive, p. 637. <a href='https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up?q=%E6%A8%97'>https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up</a></li></ul>",
    "<img id='light-box-image' src='./images/test.png'><p>Ailanthus Altissima (a.k.a 臭椿, Tree of Heaven, Ghetto Palm, Stink Tree) is the preferred host species for the Spotted Lanternfly.  It was first brought to the United Kingdom from China in the 1740s as a failed attempt to establish silk production and then later introduced to the United States in 1784 as an ornamental. In China, Tree of Heaven is mentioned in the 本草 or Materia Medica for having curative and astringent properties. Tree of Heaven is considered invasive and has a storied cultural history in NYC, for example, as the primary metaphor in Betty Smith's 1943 novel, <em>A Tree Grows in Brooklyn.</em></p><ul><li>Battles, Matthew. 'Of Silk and Invasion.' Arnold Arboretum, July 20, 2022. <a href='https://arboretum.harvard.edu/stories/of-silk-and-invasion/'>https://arboretum.harvard.edu/stories/of-silk-and-invasion/</a></li><li>Hu, Shiu Ying. ;'Ailanthus.' Arnoldia 39, no. 2 (March/April 1979): 29–50. <a href='https://www.jstor.org/stable/42954660'>https://www.jstor.org/stable/42954660.</a></li><li>Smith, Betty. A Tree Grows in Brooklyn. New York: Harper & Brothers, 1943.</li><li>Tang Shenwei (唐慎微). <em>Chong xiu Zhenghe jing shi zheng lei bei yong ben cao</em> (重修政和經史證類備用本草). 1249. Internet Archive, p. 637. <a href='https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up?q=%E6%A8%97'>https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up</a></li></ul>",
  "<img id='light-box-image' src='./images/test.png'><p>Ailanthus Altissima (a.k.a 臭椿, Tree of Heaven, Ghetto Palm, Stink Tree) is the preferred host species for the Spotted Lanternfly.  It was first brought to the United Kingdom from China in the 1740s as a failed attempt to establish silk production and then later introduced to the United States in 1784 as an ornamental. In China, Tree of Heaven is mentioned in the 本草 or Materia Medica for having curative and astringent properties. Tree of Heaven is considered invasive and has a storied cultural history in NYC, for example, as the primary metaphor in Betty Smith's 1943 novel, <em>A Tree Grows in Brooklyn.</em></p><ul><li>Battles, Matthew. 'Of Silk and Invasion.' Arnold Arboretum, July 20, 2022. <a href='https://arboretum.harvard.edu/stories/of-silk-and-invasion/'>https://arboretum.harvard.edu/stories/of-silk-and-invasion/</a></li><li>Hu, Shiu Ying. ;'Ailanthus.' Arnoldia 39, no. 2 (March/April 1979): 29–50. <a href='https://www.jstor.org/stable/42954660'>https://www.jstor.org/stable/42954660.</a></li><li>Smith, Betty. A Tree Grows in Brooklyn. New York: Harper & Brothers, 1943.</li><li>Tang Shenwei (唐慎微). <em>Chong xiu Zhenghe jing shi zheng lei bei yong ben cao</em> (重修政和經史證類備用本草). 1249. Internet Archive, p. 637. <a href='https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up?q=%E6%A8%97'>https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up</a></li></ul>",
  "<img id='light-box-image' src='./images/test.png'><p>Ailanthus Altissima (a.k.a 臭椿, Tree of Heaven, Ghetto Palm, Stink Tree) is the preferred host species for the Spotted Lanternfly.  It was first brought to the United Kingdom from China in the 1740s as a failed attempt to establish silk production and then later introduced to the United States in 1784 as an ornamental. In China, Tree of Heaven is mentioned in the 本草 or Materia Medica for having curative and astringent properties. Tree of Heaven is considered invasive and has a storied cultural history in NYC, for example, as the primary metaphor in Betty Smith's 1943 novel, <em>A Tree Grows in Brooklyn.</em></p><ul><li>Battles, Matthew. 'Of Silk and Invasion.' Arnold Arboretum, July 20, 2022. <a href='https://arboretum.harvard.edu/stories/of-silk-and-invasion/'>https://arboretum.harvard.edu/stories/of-silk-and-invasion/</a></li><li>Hu, Shiu Ying. ;'Ailanthus.' Arnoldia 39, no. 2 (March/April 1979): 29–50. <a href='https://www.jstor.org/stable/42954660'>https://www.jstor.org/stable/42954660.</a></li><li>Smith, Betty. A Tree Grows in Brooklyn. New York: Harper & Brothers, 1943.</li><li>Tang Shenwei (唐慎微). <em>Chong xiu Zhenghe jing shi zheng lei bei yong ben cao</em> (重修政和經史證類備用本草). 1249. Internet Archive, p. 637. <a href='https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up?q=%E6%A8%97'>https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up</a></li></ul>",
  "<img id='light-box-image' src='./images/test.png'><p>Ailanthus Altissima (a.k.a 臭椿, Tree of Heaven, Ghetto Palm, Stink Tree) is the preferred host species for the Spotted Lanternfly.  It was first brought to the United Kingdom from China in the 1740s as a failed attempt to establish silk production and then later introduced to the United States in 1784 as an ornamental. In China, Tree of Heaven is mentioned in the 本草 or Materia Medica for having curative and astringent properties. Tree of Heaven is considered invasive and has a storied cultural history in NYC, for example, as the primary metaphor in Betty Smith's 1943 novel, <em>A Tree Grows in Brooklyn.</em></p><ul><li>Battles, Matthew. 'Of Silk and Invasion.' Arnold Arboretum, July 20, 2022. <a href='https://arboretum.harvard.edu/stories/of-silk-and-invasion/'>https://arboretum.harvard.edu/stories/of-silk-and-invasion/</a></li><li>Hu, Shiu Ying. ;'Ailanthus.' Arnoldia 39, no. 2 (March/April 1979): 29–50. <a href='https://www.jstor.org/stable/42954660'>https://www.jstor.org/stable/42954660.</a></li><li>Smith, Betty. A Tree Grows in Brooklyn. New York: Harper & Brothers, 1943.</li><li>Tang Shenwei (唐慎微). <em>Chong xiu Zhenghe jing shi zheng lei bei yong ben cao</em> (重修政和經史證類備用本草). 1249. Internet Archive, p. 637. <a href='https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up?q=%E6%A8%97'>https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up</a></li></ul>",
  "<img id='light-box-image' src='./images/test.png'><p>Ailanthus Altissima (a.k.a 臭椿, Tree of Heaven, Ghetto Palm, Stink Tree) is the preferred host species for the Spotted Lanternfly.  It was first brought to the United Kingdom from China in the 1740s as a failed attempt to establish silk production and then later introduced to the United States in 1784 as an ornamental. In China, Tree of Heaven is mentioned in the 本草 or Materia Medica for having curative and astringent properties. Tree of Heaven is considered invasive and has a storied cultural history in NYC, for example, as the primary metaphor in Betty Smith's 1943 novel, <em>A Tree Grows in Brooklyn.</em></p><ul><li>Battles, Matthew. 'Of Silk and Invasion.' Arnold Arboretum, July 20, 2022. <a href='https://arboretum.harvard.edu/stories/of-silk-and-invasion/'>https://arboretum.harvard.edu/stories/of-silk-and-invasion/</a></li><li>Hu, Shiu Ying. ;'Ailanthus.' Arnoldia 39, no. 2 (March/April 1979): 29–50. <a href='https://www.jstor.org/stable/42954660'>https://www.jstor.org/stable/42954660.</a></li><li>Smith, Betty. A Tree Grows in Brooklyn. New York: Harper & Brothers, 1943.</li><li>Tang Shenwei (唐慎微). <em>Chong xiu Zhenghe jing shi zheng lei bei yong ben cao</em> (重修政和經史證類備用本草). 1249. Internet Archive, p. 637. <a href='https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up?q=%E6%A8%97'>https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up</a></li></ul>",
    "<img id='light-box-image' src='./images/test.png'><p>Ailanthus Altissima (a.k.a 臭椿, Tree of Heaven, Ghetto Palm, Stink Tree) is the preferred host species for the Spotted Lanternfly.  It was first brought to the United Kingdom from China in the 1740s as a failed attempt to establish silk production and then later introduced to the United States in 1784 as an ornamental. In China, Tree of Heaven is mentioned in the 本草 or Materia Medica for having curative and astringent properties. Tree of Heaven is considered invasive and has a storied cultural history in NYC, for example, as the primary metaphor in Betty Smith's 1943 novel, <em>A Tree Grows in Brooklyn.</em></p><ul><li>Battles, Matthew. 'Of Silk and Invasion.' Arnold Arboretum, July 20, 2022. <a href='https://arboretum.harvard.edu/stories/of-silk-and-invasion/'>https://arboretum.harvard.edu/stories/of-silk-and-invasion/</a></li><li>Hu, Shiu Ying. ;'Ailanthus.' Arnoldia 39, no. 2 (March/April 1979): 29–50. <a href='https://www.jstor.org/stable/42954660'>https://www.jstor.org/stable/42954660.</a></li><li>Smith, Betty. A Tree Grows in Brooklyn. New York: Harper & Brothers, 1943.</li><li>Tang Shenwei (唐慎微). <em>Chong xiu Zhenghe jing shi zheng lei bei yong ben cao</em> (重修政和經史證類備用本草). 1249. Internet Archive, p. 637. <a href='https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up?q=%E6%A8%97'>https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up</a></li></ul>",
  "<img id='light-box-image' src='./images/test.png'><p>Ailanthus Altissima (a.k.a 臭椿, Tree of Heaven, Ghetto Palm, Stink Tree) is the preferred host species for the Spotted Lanternfly.  It was first brought to the United Kingdom from China in the 1740s as a failed attempt to establish silk production and then later introduced to the United States in 1784 as an ornamental. In China, Tree of Heaven is mentioned in the 本草 or Materia Medica for having curative and astringent properties. Tree of Heaven is considered invasive and has a storied cultural history in NYC, for example, as the primary metaphor in Betty Smith's 1943 novel, <em>A Tree Grows in Brooklyn.</em></p><ul><li>Battles, Matthew. 'Of Silk and Invasion.' Arnold Arboretum, July 20, 2022. <a href='https://arboretum.harvard.edu/stories/of-silk-and-invasion/'>https://arboretum.harvard.edu/stories/of-silk-and-invasion/</a></li><li>Hu, Shiu Ying. ;'Ailanthus.' Arnoldia 39, no. 2 (March/April 1979): 29–50. <a href='https://www.jstor.org/stable/42954660'>https://www.jstor.org/stable/42954660.</a></li><li>Smith, Betty. A Tree Grows in Brooklyn. New York: Harper & Brothers, 1943.</li><li>Tang Shenwei (唐慎微). <em>Chong xiu Zhenghe jing shi zheng lei bei yong ben cao</em> (重修政和經史證類備用本草). 1249. Internet Archive, p. 637. <a href='https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up?q=%E6%A8%97'>https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up</a></li></ul>",
  "<img id='light-box-image' src='./images/test.png'><p>Ailanthus Altissima (a.k.a 臭椿, Tree of Heaven, Ghetto Palm, Stink Tree) is the preferred host species for the Spotted Lanternfly.  It was first brought to the United Kingdom from China in the 1740s as a failed attempt to establish silk production and then later introduced to the United States in 1784 as an ornamental. In China, Tree of Heaven is mentioned in the 本草 or Materia Medica for having curative and astringent properties. Tree of Heaven is considered invasive and has a storied cultural history in NYC, for example, as the primary metaphor in Betty Smith's 1943 novel, <em>A Tree Grows in Brooklyn.</em></p><ul><li>Battles, Matthew. 'Of Silk and Invasion.' Arnold Arboretum, July 20, 2022. <a href='https://arboretum.harvard.edu/stories/of-silk-and-invasion/'>https://arboretum.harvard.edu/stories/of-silk-and-invasion/</a></li><li>Hu, Shiu Ying. ;'Ailanthus.' Arnoldia 39, no. 2 (March/April 1979): 29–50. <a href='https://www.jstor.org/stable/42954660'>https://www.jstor.org/stable/42954660.</a></li><li>Smith, Betty. A Tree Grows in Brooklyn. New York: Harper & Brothers, 1943.</li><li>Tang Shenwei (唐慎微). <em>Chong xiu Zhenghe jing shi zheng lei bei yong ben cao</em> (重修政和經史證類備用本草). 1249. Internet Archive, p. 637. <a href='https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up?q=%E6%A8%97'>https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up</a></li></ul>",
  "<img id='light-box-image' src='./images/test.png'><p>Ailanthus Altissima (a.k.a 臭椿, Tree of Heaven, Ghetto Palm, Stink Tree) is the preferred host species for the Spotted Lanternfly.  It was first brought to the United Kingdom from China in the 1740s as a failed attempt to establish silk production and then later introduced to the United States in 1784 as an ornamental. In China, Tree of Heaven is mentioned in the 本草 or Materia Medica for having curative and astringent properties. Tree of Heaven is considered invasive and has a storied cultural history in NYC, for example, as the primary metaphor in Betty Smith's 1943 novel, <em>A Tree Grows in Brooklyn.</em></p><ul><li>Battles, Matthew. 'Of Silk and Invasion.' Arnold Arboretum, July 20, 2022. <a href='https://arboretum.harvard.edu/stories/of-silk-and-invasion/'>https://arboretum.harvard.edu/stories/of-silk-and-invasion/</a></li><li>Hu, Shiu Ying. ;'Ailanthus.' Arnoldia 39, no. 2 (March/April 1979): 29–50. <a href='https://www.jstor.org/stable/42954660'>https://www.jstor.org/stable/42954660.</a></li><li>Smith, Betty. A Tree Grows in Brooklyn. New York: Harper & Brothers, 1943.</li><li>Tang Shenwei (唐慎微). <em>Chong xiu Zhenghe jing shi zheng lei bei yong ben cao</em> (重修政和經史證類備用本草). 1249. Internet Archive, p. 637. <a href='https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up?q=%E6%A8%97'>https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up</a></li></ul>",
  "<img id='light-box-image' src='./images/test.png'><p>Ailanthus Altissima (a.k.a 臭椿, Tree of Heaven, Ghetto Palm, Stink Tree) is the preferred host species for the Spotted Lanternfly.  It was first brought to the United Kingdom from China in the 1740s as a failed attempt to establish silk production and then later introduced to the United States in 1784 as an ornamental. In China, Tree of Heaven is mentioned in the 本草 or Materia Medica for having curative and astringent properties. Tree of Heaven is considered invasive and has a storied cultural history in NYC, for example, as the primary metaphor in Betty Smith's 1943 novel, <em>A Tree Grows in Brooklyn.</em></p><ul><li>Battles, Matthew. 'Of Silk and Invasion.' Arnold Arboretum, July 20, 2022. <a href='https://arboretum.harvard.edu/stories/of-silk-and-invasion/'>https://arboretum.harvard.edu/stories/of-silk-and-invasion/</a></li><li>Hu, Shiu Ying. ;'Ailanthus.' Arnoldia 39, no. 2 (March/April 1979): 29–50. <a href='https://www.jstor.org/stable/42954660'>https://www.jstor.org/stable/42954660.</a></li><li>Smith, Betty. A Tree Grows in Brooklyn. New York: Harper & Brothers, 1943.</li><li>Tang Shenwei (唐慎微). <em>Chong xiu Zhenghe jing shi zheng lei bei yong ben cao</em> (重修政和經史證類備用本草). 1249. Internet Archive, p. 637. <a href='https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up?q=%E6%A8%97'>https://archive.org/details/54053033-1-1299/54053033-1-1299/page/n636/mode/1up</a></li></ul>",
  // ...add more as needed
];

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

  const gray = new Float32Array(w * h);
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
function regenerateDither() {
  if (!baseFullRes) return;

  const tmp = createGraphics(SIZE * SCALE, SIZE * SCALE);
  tmp.pixelDensity(1);
  tmp.image(baseFullRes, 0, 0);

  jitterPixels(tmp, REGEN_NOISE_AMOUNT);
  ditherFloydSteinbergBW(tmp);

  ditheredResult = tmp;
}

function setup() {
  pixelDensity(1);
  mainCanvas = createCanvas(SIZE * SCALE, SIZE * SCALE);
  mainCanvas.parent('output');

  modelCanvas = createGraphics(SIZE, SIZE);
  modelCanvas.pixelDensity(1);

  background(0);

  statusMsg = select('#status');
  clearBtn = select('#clearBtn');
  clearBtn.mousePressed(clearCanvas);

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

function mousePressed() {
  if (clickCounter >= instructionNumber) {
    let clickedStar = null;
    let clickedIndex = null;

    stars.forEach((star, index) => {
      if (!clickedStar && dist(mouseX, mouseY, star.x, star.y) < 20) {
        clickedStar = star;
        clickedIndex = index;
      }
    });

    if (clickedStar) {
      const willSelect = !clickedStar.selected;
      stars.forEach(star => star.selected = false);
      clickedStar.selected = willSelect;

      const lightbox = document.querySelector("#light-box");
      if (willSelect && lightbox && clickedIndex !== null && STAR_TEXTS[clickedIndex]) {
        const contentDiv = lightbox.querySelector("#light-box-content-text");
        if (contentDiv) {
          contentDiv.innerHTML = STAR_TEXTS[clickedIndex];
        }
        lightbox.style.display = "block";
      } else if (lightbox) {
        lightbox.style.display = "none";
      }
    }

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

function touchStarted() {
  if (touches.length > 0) {
    // After all stars are placed, taps toggle selection
    if (clickCounter >= instructionNumber) {
      stars.forEach(star => {
        if (dist(touches[0].x, touches[0].y, star.x, star.y) < 20) {
          star.selected = !star.selected;
        }
      });
      return false;
    }

    handlePointer(touches[0].x, touches[0].y);
  }
  return false;
}

function touchMoved() {
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
    this.driftRange = 1;
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
      this.driftRange = 15;
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

function keyPressed() {
  if (key === 's' || key === 'S') {
    downloadCanvasAsImage();
  }
}