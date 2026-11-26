// NGỮ PHÁP CHO NGƯỜI NÓI – học theo nhu cầu giao tiếp
// Mỗi bài: khi nào dùng · công thức · dấu hiệu · lỗi người Việt hay mắc · ví dụ · trắc nghiệm · sửa lỗi · NÓI
// quiz: [câu có ___, các lựa chọn (đáp án đúng đứng ĐẦU, app tự xáo), giải thích]
// fix: [câu sai, câu đúng, giải thích]
// speak: [tình huống tiếng Việt, câu mẫu, cụm bắt buộc (phân cách ';', dùng '/' cho phương án)]
export const grammarLessons = [
  {
    id: 'g-present', level: 1, emoji: '🔁', title: 'Present simple vs continuous', titleVi: 'Thói quen hay đang diễn ra?',
    need: 'Nói về thói quen, sự thật, lịch trình – và việc đang làm ngay lúc này / dạo này.',
    when: [
      '<b>Hiện tại đơn</b>: thói quen, việc lặp lại, sự thật, lịch cố định. “I go to the lab every day.”',
      '<b>Hiện tại tiếp diễn</b>: đang xảy ra ngay lúc nói, hoặc tạm thời “dạo này”. “I’m writing my thesis these days.”',
      'Động từ trạng thái (know, like, want, need, believe, understand) gần như KHÔNG dùng -ing: “I know”, không nói “I’m knowing”.',
    ],
    form: [['Hiện tại đơn', 'I/you/we/they + V · he/she/it + V-s/es · phủ định: don’t/doesn’t + V · hỏi: Do/Does + S + V?'], ['Hiện tại tiếp diễn', 'S + am/is/are + V-ing · phủ định: am not/isn’t/aren’t + V-ing · hỏi: Am/Is/Are + S + V-ing?']],
    signals: 'every day, usually, often, always, on Mondays → đơn · now, right now, at the moment, these days, currently, Look! → tiếp diễn',
    mistakes: [['He work in a lab.', 'He works in a lab.', 'Ngôi thứ 3 số ít phải thêm -s. Tiếng Việt không chia động từ nên rất hay quên.'], ['I am agree.', 'I agree.', '“agree” là động từ, không dùng thêm “am”.'], ['I’m usually going to the gym.', 'I usually go to the gym.', 'Thói quen → hiện tại đơn.']],
    examples: [['My advisor usually replies within a day.', 'Giáo sư thường trả lời trong vòng một ngày.'], ['I’m running an experiment right now, can I call you back?', 'Mình đang chạy thí nghiệm, gọi lại sau nhé?'], ['The shuttle bus leaves at 8:10.', 'Xe đưa đón chạy lúc 8:10 (lịch cố định).']],
    quiz: [['She ___ in the cleanroom every morning.', ['works', 'work', 'is work'], 'Thói quen + she → V-s.'], ['Shh! The professor ___ a call.', ['is taking', 'takes', 'take'], '“Shh!” = đang xảy ra lúc nói.'], ['I ___ what you mean.', ['know', 'am knowing', 'knowing'], '“know” là động từ trạng thái.'], ['These days I ___ a lot of papers for my thesis.', ['am reading', 'read', 'reads'], '“these days” = tạm thời dạo này.']],
    speak: [['Nói rằng bạn thường đi ăn ở chợ đêm vào thứ Sáu.', 'I usually eat at the night market on Fridays.', 'usually; eat/go'], ['Bạn đang ở phòng sạch, nói với bạn cùng phòng là bạn đang làm thí nghiệm và gọi lại sau.', "I'm doing an experiment right now, I'll call you back.", "i'm/i am; -ing/doing/running"], ['Nói rằng giáo sư của bạn không thích những bài báo cáo dài.', "My professor doesn't like long reports.", "doesn't/does not; like"]],
  },
  {
    id: 'g-past', level: 1, emoji: '⏪', title: 'Past simple & past continuous', titleVi: 'Kể chuyện đã xảy ra',
    need: 'Kể lại chuyện hôm qua, tuần trước, sự cố trong lab – có thời điểm cụ thể đã kết thúc.',
    when: [
      '<b>Quá khứ đơn</b>: hành động đã xong, tại thời điểm xác định trong quá khứ. “I met him yesterday.”',
      '<b>Quá khứ tiếp diễn</b>: đang diễn ra thì có việc khác xen vào (when), hoặc làm bối cảnh cho câu chuyện. “I was etching the wafer when the alarm went off.”',
      'Mẹo kể chuyện: bối cảnh dùng tiếp diễn, các sự kiện chính dùng quá khứ đơn.',
    ],
    form: [['Quá khứ đơn', 'S + V-ed / V2 (bất quy tắc) · phủ định: didn’t + V · hỏi: Did + S + V?'], ['Quá khứ tiếp diễn', 'S + was/were + V-ing']],
    signals: 'yesterday, last week, ago, in 2023, when I was a kid → quá khứ đơn · when/while + đang làm gì → tiếp diễn',
    mistakes: [['Yesterday I go to the clinic.', 'Yesterday I went to the clinic.', 'Có “yesterday” là phải chia quá khứ. Người Việt hay giữ động từ nguyên mẫu.'], ['I didn’t went.', 'I didn’t go.', 'Sau didn’t dùng động từ nguyên mẫu.'], ['When the power went out, I worked on the tool.', 'When the power went out, I was working on the tool.', 'Việc đang diễn ra bị xen ngang → quá khứ tiếp diễn.']],
    examples: [['The pump stopped working last night.', 'Bơm ngừng chạy tối qua.'], ['I was cooking when my roommate came home.', 'Mình đang nấu ăn thì bạn cùng phòng về.'], ['Did you send the data to the professor?', 'Bạn đã gửi dữ liệu cho giáo sư chưa?']],
    quiz: [['I ___ my wallet on the MRT yesterday.', ['lost', 'lose', 'have lost'], '“yesterday” → quá khứ đơn; lose → lost.'], ['We ___ dinner when the typhoon warning came.', ['were having', 'had', 'have'], 'Đang ăn thì có việc xen vào.'], ['___ you finish the report last night?', ['Did', 'Do', 'Were'], 'Câu hỏi quá khứ đơn dùng Did.'], ['She didn’t ___ the meeting.', ['attend', 'attended', 'attending'], 'Sau didn’t → V nguyên mẫu.']],
    speak: [['Kể rằng tối qua máy sputter bị hỏng.', 'The sputter tool broke down last night.', 'broke/stopped/didn’t; last night'], ['Kể: bạn đang nấu ăn thì chuông báo cháy kêu.', 'I was cooking when the fire alarm went off.', 'was cooking/was; when; went off/rang'], ['Hỏi bạn cùng phòng hôm qua bạn ấy có đi chợ đêm không.', 'Did you go to the night market yesterday?', 'did you; go']],
  },
  {
    id: 'g-perfect', level: 2, emoji: '✅', title: 'Present perfect vs past simple', titleVi: 'Đã từng / vừa xong / đến giờ',
    need: 'Nói về trải nghiệm, kết quả còn liên quan tới hiện tại, việc kéo dài đến bây giờ.',
    when: [
      '<b>Hiện tại hoàn thành</b> khi KHÔNG nói thời điểm cụ thể và điều quan trọng là kết quả/trải nghiệm bây giờ: “I’ve finished the slides.” (giờ đã có slide)',
      'Kéo dài từ quá khứ đến nay: “I’ve lived in Taiwan for two years / since 2024.”',
      'Có thời điểm quá khứ cụ thể (yesterday, last year, in 2023) → bắt buộc dùng <b>quá khứ đơn</b>.',
      'Quy tắc nhanh: “Đã… chưa? / từng… chưa?” thường là hiện tại hoàn thành; “Hôm qua/năm ngoái đã…” là quá khứ đơn.',
    ],
    form: [['Hiện tại hoàn thành', 'S + have/has + V3 · phủ định: haven’t/hasn’t + V3 · hỏi: Have/Has + S + V3?'], ['for / since', 'for + khoảng thời gian (for 3 months) · since + mốc (since March)']],
    signals: 'already, yet, just, ever, never, so far, recently, for, since → hoàn thành · yesterday, ago, last…, in 2020 → quá khứ đơn',
    mistakes: [['I have seen him yesterday.', 'I saw him yesterday.', 'Có “yesterday” → không dùng hiện tại hoàn thành.'], ['I live here since 2024.', 'I’ve lived here since 2024.', '“since” → kéo dài đến nay → hiện tại hoàn thành.'], ['Did you ever try stinky tofu?', 'Have you ever tried stinky tofu?', 'Hỏi trải nghiệm (ever) → hiện tại hoàn thành.']],
    examples: [['Have you finished the measurements yet?', 'Bạn đo xong chưa?'], ['I’ve been in Taiwan for eight months.', 'Mình ở Đài Loan được 8 tháng rồi.'], ['I’ve never been to Kenting, but I went to Tainan last month.', 'Chưa từng đi Kenting, nhưng tháng trước đã đi Đài Nam.']],
    quiz: [['I ___ here since last September.', ['have lived', 'lived', 'live'], '“since” → hiện tại hoàn thành.'], ['We ___ the new sample two days ago.', ['made', 'have made', 'make'], '“ago” → quá khứ đơn.'], ['___ you ever ___ bubble tea with cheese foam?', ['Have / tried', 'Did / try', 'Do / try'], 'Trải nghiệm “ever”.'], ['The tool is ready. The technician ___ fixed it.', ['has just', 'just has', 'did just'], 'Kết quả vừa xong, “just” đứng giữa has và V3.']],
    speak: [['Nói rằng bạn đã ở Đài Loan được hai năm.', "I've been in Taiwan for two years.", "i've/i have; been/lived; for"], ['Hỏi bạn lab xem bạn ấy đã gửi báo cáo cho giáo sư chưa.', 'Have you sent the report to the professor yet?', 'have you; sent; yet'], ['Nói rằng bạn chưa bao giờ thử đậu phụ thối.', "I've never tried stinky tofu.", "i've/i have; never; tried/eaten"]],
  },
  {
    id: 'g-future', level: 1, emoji: '🔮', title: 'Future: will / going to / present continuous', titleVi: 'Nói về kế hoạch & dự đoán',
    need: 'Hẹn hò, lên kế hoạch, hứa hẹn, quyết định tức thời, dự đoán.',
    when: [
      '<b>will</b>: quyết định NGAY lúc nói, lời hứa, đề nghị giúp. “I’ll send it now.” “I’ll help you.”',
      '<b>be going to</b>: dự định đã có từ trước; dự đoán có dấu hiệu rõ. “I’m going to apply for a PhD.” “Look at the clouds, it’s going to rain.”',
      '<b>Hiện tại tiếp diễn</b>: lịch hẹn đã sắp xếp chắc chắn (có giờ, có người). “I’m meeting my advisor at 3.”',
    ],
    form: [['will', 'S + will (’ll) + V · won’t + V'], ['be going to', 'S + am/is/are + going to (gonna) + V'], ['Kế hoạch đã sắp xếp', 'S + am/is/are + V-ing + thời gian tương lai']],
    signals: 'Quyết định tức thì / hứa → will · đã định từ trước → going to · đã hẹn giờ cụ thể → V-ing',
    mistakes: [['I will to go home.', 'I’ll go home.', 'Sau will là V nguyên mẫu, không có “to”.'], ['Tomorrow I go to Taipei with my friends.', 'Tomorrow I’m going to Taipei with my friends.', 'Kế hoạch đã sắp xếp → tiếp diễn hoặc going to.'], ['A: The phone is ringing. B: I’m going to answer it.', 'I’ll get it.', 'Quyết định ngay lúc đó → will.']],
    examples: [['I’m presenting at the group meeting on Monday.', 'Thứ Hai mình thuyết trình ở buổi họp nhóm (đã lên lịch).'], ['Don’t worry, I’ll take out the trash.', 'Đừng lo, để mình đổ rác (quyết định ngay).'], ['I’m going to learn Chinese next semester.', 'Học kỳ sau mình định học tiếng Trung.']],
    quiz: [['A: We’re out of milk. B: Oh, I ___ some.', ['’ll buy', '’m buying', 'buy'], 'Quyết định ngay lúc nói.'], ['I ___ my advisor at 2 p.m. tomorrow, it’s in the calendar.', ['am meeting', 'will meet maybe', 'meet'], 'Lịch hẹn đã sắp xếp.'], ['Look at that sky! It ___ rain.', ['is going to', 'will to', 'rains'], 'Dự đoán có dấu hiệu.'], ['I promise I ___ be late again.', ["won't", "am not going", "don't"], 'Lời hứa → will/won’t.']],
    speak: [['Bạn cùng phòng than hết giấy vệ sinh. Bạn quyết định đi mua ngay.', "I'll go buy some now.", "i'll/i will; buy/get"], ['Nói rằng cuối tuần này bạn định đi leo núi Elephant Mountain.', "I'm going to hike Elephant Mountain this weekend.", "going to/gonna/i'm; this weekend"], ['Nói rằng bạn đã hẹn gặp giáo sư lúc 3 giờ chiều mai.', "I'm meeting my professor at 3 p.m. tomorrow.", "i'm meeting/i am meeting; tomorrow"]],
  },
  {
    id: 'g-questions', level: 1, emoji: '❓', title: 'Asking questions', titleVi: 'Đặt câu hỏi đúng',
    need: 'Hỏi thông tin trôi chảy – người Việt hay quên trợ động từ hoặc giữ trật tự câu khẳng định.',
    when: [
      'Câu hỏi Có/Không: đưa trợ động từ lên đầu: Do/Does/Did/Is/Are/Have/Can + S + V?',
      'Câu hỏi Wh-: Wh- + trợ động từ + S + V? “Where do you live?” “What did he say?”',
      'Câu hỏi lịch sự (gián tiếp): “Could you tell me where the lab is?” – sau phần mở đầu, trật tự trở lại như câu khẳng định (KHÔNG đảo).',
      'Nói nhanh tự nhiên: “Do you” → /dʒə/, “Did you” → /dɪdʒə/.',
    ],
    form: [['Yes/No', 'Trợ động từ + S + V…?'], ['Wh-', 'Wh- + trợ động từ + S + V…?'], ['Gián tiếp', 'Could you tell me / Do you know + wh- + S + V?']],
    signals: 'Có “do/does/did” thì động từ chính giữ nguyên mẫu.',
    mistakes: [['Where you live?', 'Where do you live?', 'Thiếu trợ động từ “do”.'], ['What time the meeting starts?', 'What time does the meeting start?', 'Cần “does” và bỏ -s ở start.'], ['Could you tell me where is the restroom?', 'Could you tell me where the restroom is?', 'Câu hỏi gián tiếp không đảo ngữ.']],
    examples: [['How long have you been in Taiwan?', 'Bạn ở Đài Loan bao lâu rồi?'], ['Do you know if the SEM is free this afternoon?', 'Bạn có biết chiều nay máy SEM có trống không?'], ['What did the professor say about the results?', 'Giáo sư nói gì về kết quả?']],
    quiz: [['Where ___ you buy that jacket?', ['did', 'do you', 'are'], 'Hỏi về quá khứ → did.'], ['Do you know where ___?', ['the station is', 'is the station', 'the station are'], 'Câu hỏi gián tiếp không đảo.'], ['How often ___ she go to the gym?', ['does', 'do', 'is'], 'she → does.'], ['___ you ever been to Hualien?', ['Have', 'Did', 'Do'], 'been → have.']],
    speak: [['Hỏi một bạn mới quen là bạn ấy học ngành gì.', 'What do you study?', 'what; do you; study/major'], ['Hỏi lịch sự nhân viên xem phòng 302 ở đâu.', 'Could you tell me where room 302 is?', 'could you tell me/do you know; where; is'], ['Hỏi bạn lab hôm qua giáo sư đã nói gì.', 'What did the professor say yesterday?', 'what did; say']],
  },
  {
    id: 'g-modals', level: 2, emoji: '🎚️', title: 'Modal verbs', titleVi: 'Khuyên, bắt buộc, khả năng (should, must, might…)',
    need: 'Đưa lời khuyên, nói quy định phòng sạch, xin phép, đoán khả năng – một nhóm cực hay dùng khi nói.',
    when: [
      '<b>should</b>: khuyên. “You should rest.” · <b>must / have to</b>: bắt buộc (must = người nói thấy cần, have to = quy định bên ngoài). “You have to wear gloves.”',
      '<b>don’t have to</b> = không cần (khác <b>mustn’t</b> = cấm!). “You don’t have to come.” vs “You mustn’t touch the wafer.”',
      '<b>can / could</b>: khả năng, xin phép (could lịch sự hơn). <b>might / may / could</b>: có thể (khoảng 50%). <b>must</b> (suy luận chắc chắn): “He must be tired.”',
    ],
    form: [['Công thức chung', 'S + modal + V nguyên mẫu (không “to”, không -s): She can speak, NOT She cans speaks'], ['Quá khứ của suy đoán', 'might/must/should + have + V3: “I should have checked the O-ring.”']],
    signals: 'Khuyên → should · Quy định → have to/must · Cấm → mustn’t/can’t · Không cần → don’t have to · Đoán → might/must',
    mistakes: [['You should to see a doctor.', 'You should see a doctor.', 'Sau modal không có “to”.'], ['She can speaks English.', 'She can speak English.', 'Sau modal không chia động từ.'], ['You mustn’t come to the party.', 'You don’t have to come to the party.', 'Ý “không bắt buộc” phải dùng don’t have to; mustn’t là cấm.']],
    examples: [['You have to gown up before entering.', 'Phải mặc đồ trước khi vào.'], ['It might be a leak in the gas line.', 'Có thể là rò ở đường khí.'], ['I should have backed up my data.', 'Đáng lẽ mình phải sao lưu dữ liệu.']],
    quiz: [['You look exhausted. You ___ get some sleep.', ['should', 'must to', 'might'], 'Lời khuyên.'], ['You ___ touch the wafer surface with bare hands.', ['mustn’t', 'don’t have to', 'shouldn’t to'], 'Quy định cấm.'], ['Tomorrow is a holiday, so we ___ go to the lab.', ['don’t have to', 'mustn’t', 'can’t to'], 'Không bắt buộc.'], ['His light is still on at 3 a.m. He ___ be working.', ['must', 'should', 'has to'], 'Suy luận chắc chắn.']],
    speak: [['Khuyên bạn cùng phòng nên đi khám vì ho đã một tuần.', 'You should see a doctor.', 'should; see/go'], ['Nhắc đàn em rằng phải đeo hai lớp găng khi dùng HF.', 'You have to wear double gloves when you use HF.', 'have to/must; wear'], ['Đoán rằng nguyên nhân có thể là O-ring bị nứt.', 'It might be a cracked O-ring.', 'might/may/could; be']],
  },
  {
    id: 'g-articles', level: 2, emoji: '🅰️', title: 'Articles & countable nouns', titleVi: 'a / an / the & danh từ đếm được',
    need: 'Lỗi số 1 của người Việt khi viết và nói học thuật – tiếng Việt không có mạo từ.',
    when: [
      '<b>a/an</b>: danh từ đếm được số ít, nhắc lần đầu / bất kỳ. “I bought a new laptop.” (an + âm nguyên âm: an hour, an SEM image)',
      '<b>the</b>: cả hai đều biết đang nói cái nào, đã nhắc trước đó, duy nhất. “The laptop is fast.” “the professor (của chúng ta)”',
      'Không mạo từ: danh từ số nhiều / không đếm được nói chung. “Students need sleep.” “Information is important.”',
      'Không đếm được hay gặp: information, advice, equipment, research, feedback, data (thường), homework, furniture, luggage → không có -s, không “a”.',
    ],
    form: [['Đếm được số ít', 'BẮT BUỘC có a/an/the/my… trước: a sample, the sample, my sample'], ['Không đếm được', 'some advice, a piece of advice, much information']],
    signals: 'Nhắc lần 2 → the · “một cái nào đó” → a/an · nói chung chung số nhiều → không mạo từ',
    mistakes: [['I am student.', 'I am a student.', 'Danh từ đếm được số ít cần “a”.'], ['Can you give me some advices?', 'Can you give me some advice?', '“advice” không đếm được.'], ['The life in Taipei is convenient.', 'Life in Taipei is convenient.', 'Nói chung chung về “cuộc sống” → không the.']],
    examples: [['I have a question about the data you sent.', 'Mình có một câu hỏi về dữ liệu bạn gửi.'], ['We need new equipment for the lab.', 'Lab cần thiết bị mới.'], ['It took an hour to pump down.', 'Mất một tiếng để hút chân không.']],
    quiz: [['She’s ___ engineer at TSMC.', ['an', 'a', 'the'], 'engineer bắt đầu bằng nguyên âm.'], ['Thanks for ___ feedback!', ['the', 'a', 'an'], 'feedback cụ thể (của bạn) → the; feedback không đếm được nên không dùng a.'], ['I need some ___ about the visa.', ['information', 'informations', 'an information'], 'Không đếm được.'], ['I bought a rice cooker. ___ rice cooker was cheap.', ['The', 'A', '—'], 'Nhắc lại lần 2 → the.']],
    speak: [['Giới thiệu bạn là sinh viên thạc sĩ ở một trường đại học tại Đài Loan.', "I'm a master's student at a university in Taiwan.", "a master's student; a university"], ['Nói rằng bạn cần lời khuyên về luận văn.', 'I need some advice about my thesis.', 'some advice/advice; my thesis'], ['Nói rằng giáo sư đã gửi bạn một bài báo, và bài báo đó rất hữu ích.', 'My professor sent me a paper, and the paper was really useful.', 'a paper; the paper/it']],
  },
  {
    id: 'g-compare', level: 2, emoji: '⚖️', title: 'Comparatives & superlatives', titleVi: 'So sánh hơn & so sánh nhất',
    need: 'So sánh kết quả thí nghiệm, thành phố, đồ ăn… và IELTS Speaking Part 3.',
    when: [
      'Tính từ ngắn (1 âm tiết, hoặc 2 âm tiết tận cùng -y): + er / the + est. cheap → cheaper → the cheapest; busy → busier.',
      'Tính từ dài: more / the most + adj. expensive → more expensive.',
      'Bất quy tắc: good → better → the best; bad → worse → the worst; far → farther/further.',
      'Nói mức độ tự nhiên: much/a lot/a bit/slightly + so sánh hơn; “not as … as”; “the + so sánh hơn, the + so sánh hơn”.',
    ],
    form: [['So sánh hơn', 'A is + adj-er / more adj + than B'], ['Nhất', 'the + adj-est / the most adj'], ['Bằng', 'as + adj + as · not as + adj + as']],
    signals: 'than → so sánh hơn · the …est / in the world / of all → nhất',
    mistakes: [['Taipei is more busy than Tainan.', 'Taipei is busier than Tainan.', 'busy là tính từ ngắn tận cùng -y.'], ['This sample is more better.', 'This sample is much better.', 'Không dùng more với better; nhấn mạnh bằng much.'], ['He is the most tall in the lab.', 'He is the tallest in the lab.', 'Tính từ ngắn dùng -est.']],
    examples: [['The new recipe gives a much smoother surface.', 'Công thức mới cho bề mặt mịn hơn nhiều.'], ['Living here is not as expensive as I expected.', 'Sống ở đây không đắt như mình nghĩ.'], ['The higher the power, the faster the etch rate.', 'Công suất càng cao, tốc độ khắc càng nhanh.']],
    quiz: [['Hsinchu is ___ than Taipei.', ['windier', 'more windy', 'windyer'], 'windy → windier.'], ['This is ___ bubble tea I’ve ever had.', ['the best', 'the better', 'the most good'], 'good → the best.'], ['The second sample is ___ thinner than the first.', ['slightly', 'more', 'very'], 'Mức độ + so sánh hơn.'], ['The more you practice, ___ you get.', ['the better', 'better', 'the best'], 'Cấu trúc càng… càng.']],
    speak: [['So sánh: sống ở Đài Loan rẻ hơn ở Nhật nhiều.', 'Living in Taiwan is much cheaper than in Japan.', 'cheaper/less expensive; than'], ['Nói rằng mẫu thứ ba là mẫu tốt nhất trong ba mẫu.', 'The third sample is the best of the three.', 'the best'], ['Nói: càng luyện nói nhiều, bạn càng tự tin.', 'The more I practice speaking, the more confident I feel.', 'the more; the more/the better']],
  },
  {
    id: 'g-cond1', level: 2, emoji: '🔀', title: 'Conditionals 0 & 1', titleVi: 'Câu điều kiện loại 0 & 1 (có thật)',
    need: 'Nói về quy luật, kết quả chắc chắn, và tình huống có thể xảy ra thật trong tương lai.',
    when: [
      '<b>Loại 0</b> – sự thật, quy luật (luôn đúng): If + hiện tại đơn, hiện tại đơn. “If you heat water to 100°C, it boils.” “If the pressure is too high, the plasma becomes unstable.”',
      '<b>Loại 1</b> – có thể xảy ra thật trong tương lai: If + hiện tại đơn, will + V. “If it rains, we’ll stay in.”',
      'LỖI KINH ĐIỂN: KHÔNG dùng will trong mệnh đề If. Cũng áp dụng cho when / as soon as / unless / before / after.',
      '<b>unless</b> = if … not. “I won’t go unless you come.”',
    ],
    form: [['Loại 0', 'If + S + V(s), S + V(s)'], ['Loại 1', 'If + S + V(s), S + will/can/might + V']],
    signals: 'Thật, có thể xảy ra → loại 0/1 · Tưởng tượng, trái thực tế → loại 2/3 (bài sau)',
    mistakes: [['If it will rain, I will stay home.', 'If it rains, I’ll stay home.', 'Không dùng will sau If.'], ['I’ll call you when I will arrive.', 'I’ll call you when I arrive.', 'Sau when (tương lai) dùng hiện tại đơn.'], ['Unless you don’t hurry, you’ll miss the bus.', 'Unless you hurry, you’ll miss the bus.', 'unless đã mang nghĩa phủ định.']],
    examples: [['If the base pressure is too high, the film quality drops.', 'Nếu áp suất nền quá cao thì chất lượng màng giảm (quy luật).'], ['If I finish early, I’ll join you for dinner.', 'Nếu xong sớm, mình sẽ đi ăn với bạn.'], ['Text me as soon as you get there.', 'Tới nơi thì nhắn mình ngay.']],
    quiz: [['If you ___ the O-ring, the chamber will leak.', ['don’t replace', 'won’t replace', 'didn’t replace'], 'If + hiện tại đơn.'], ['I’ll send you the file when I ___ home.', ['get', 'will get', 'got'], 'Sau when (tương lai) → hiện tại đơn.'], ['If you mix acid and water the wrong way, it ___ dangerous.', ['gets', 'will got', 'got'], 'Quy luật → loại 0.'], ['We’ll miss the train ___ we leave now.', ['unless', 'if', 'when'], 'unless = if not.']],
    speak: [['Nói: nếu mai trời mưa, nhóm sẽ ở nhà xem phim.', "If it rains tomorrow, we'll stay home and watch a movie.", "if it rains; we'll/we will"], ['Nói với giáo sư: nếu máy sửa xong hôm nay, em sẽ gửi dữ liệu trước thứ Sáu.', "If the tool is fixed today, I'll send you the data by Friday.", "if; is fixed/gets fixed; i'll/i will"], ['Dặn bạn: tới nơi thì nhắn mình ngay nhé.', 'Text me as soon as you get there.', 'as soon as/when; get/arrive']],
  },
  {
    id: 'g-cond2', level: 3, emoji: '💭', title: 'Conditionals 2 & 3, wish', titleVi: 'Câu điều kiện loại 2, 3 & “ước gì” (không có thật)',
    need: 'Tưởng tượng, đưa lời khuyên “nếu tôi là bạn”, tiếc nuối – rất hay gặp trong IELTS Speaking Part 3.',
    when: [
      '<b>Loại 2</b> – tưởng tượng ở hiện tại/tương lai (khó xảy ra/không thật): If + quá khứ đơn, would + V. “If I had more time, I would learn Japanese.” “If I were you, I’d talk to the professor.”',
      '<b>Loại 3</b> – tiếc nuối về quá khứ (đã không xảy ra): If + had + V3, would have + V3. “If I had checked the recipe, I wouldn’t have ruined the wafer.”',
      '<b>wish</b>: wish + quá khứ đơn (ước hiện tại khác đi), wish + had V3 (tiếc quá khứ). “I wish I spoke English more fluently.”',
      'Dùng “were” cho mọi ngôi trong “If I were…”, nói thường ngày “If I was” vẫn chấp nhận nhưng IELTS nên dùng “were”.',
    ],
    form: [['Loại 2', 'If + S + V2/were, S + would/could/might + V'], ['Loại 3', 'If + S + had + V3, S + would/could have + V3'], ['wish', 'S + wish + S + V2 (hiện tại) · had + V3 (quá khứ)']],
    signals: 'Không có thật bây giờ → loại 2 · Đã lỡ rồi, tiếc → loại 3',
    mistakes: [['If I have more money, I would buy a car.', 'If I had more money, I would buy a car.', 'Loại 2: If + quá khứ.'], ['If I would know, I would tell you.', 'If I knew, I would tell you.', 'Không dùng would trong mệnh đề If.'], ['If I studied harder last year, I would pass.', 'If I had studied harder last year, I would have passed.', 'Quá khứ không có thật → loại 3.']],
    examples: [['If I were the government, I’d invest more in public transport.', 'Nếu tôi là chính phủ, tôi sẽ đầu tư nhiều hơn vào giao thông công cộng.'], ['If we had used a dummy wafer, we wouldn’t have lost the sample.', 'Nếu đã dùng wafer thử, chúng ta đã không mất mẫu.'], ['I wish I had more free time.', 'Ước gì mình có nhiều thời gian rảnh hơn.']],
    quiz: [['If I ___ you, I’d ask the technician first.', ['were', 'am', 'would be'], 'If I were you – lời khuyên.'], ['If we ___ earlier, we would have caught the train.', ['had left', 'left', 'would leave'], 'Loại 3.'], ['I wish I ___ Chinese better.', ['spoke', 'speak', 'will speak'], 'wish + quá khứ đơn.'], ['What would you do if you ___ the lottery?', ['won', 'win', 'had won'], 'Tưởng tượng hiện tại → loại 2.']],
    speak: [['Khuyên bạn: nếu mình là bạn, mình sẽ nói chuyện thẳng với giáo sư.', "If I were you, I'd talk to the professor directly.", "if i were you; i'd/i would"], ['Tiếc: nếu đã kiểm tra công thức, mình đã không làm hỏng wafer.', "If I had checked the recipe, I wouldn't have ruined the wafer.", "if i had checked; wouldn't have/would not have"], ['Nói ước gì bạn có thể nói tiếng Anh trôi chảy hơn.', 'I wish I could speak English more fluently.', 'i wish; could speak/spoke']],
  },
  {
    id: 'g-passive', level: 3, emoji: '🧪', title: 'Passive voice', titleVi: 'Câu bị động (viết báo cáo lab)',
    need: 'Mô tả quy trình thí nghiệm, phương pháp trong paper, thông báo – khi “ai làm” không quan trọng.',
    when: [
      'Dùng bị động khi hành động/kết quả quan trọng hơn người làm: “The samples were annealed at 400 °C.”',
      'Rất phổ biến trong phần Method của paper và báo cáo lab, cũng như thông báo: “The laundry room will be closed.”',
      'Khi nói chuyện hằng ngày, chủ động thường tự nhiên hơn: “We annealed the samples.” → nói với giáo sư vẫn ổn.',
    ],
    form: [['Công thức', 'S + be (chia theo thì) + V3 (+ by …)'], ['Theo thì', 'is done · was done · has been done · will be done · is being done · can be done']],
    signals: 'Phần Method/Procedure · thông báo · khi không biết/không cần nói ai làm',
    mistakes: [['The sample was anneal at 400 °C.', 'The sample was annealed at 400 °C.', 'Bị động cần V3 (annealed).'], ['The tool is broke.', 'The tool is broken.', 'V3 của break là broken.'], ['It was happened yesterday.', 'It happened yesterday.', '“happen” không có dạng bị động.']],
    examples: [['The films were deposited by RF sputtering.', 'Màng được lắng đọng bằng phún xạ RF.'], ['The tool is being repaired right now.', 'Máy đang được sửa.'], ['All samples must be labeled.', 'Mọi mẫu phải được dán nhãn.']],
    quiz: [['The wafers ___ with acetone before deposition.', ['were cleaned', 'cleaned', 'were clean'], 'Quy trình đã làm → bị động quá khứ.'], ['The SEM ___ right now, please wait.', ['is being used', 'is using', 'used'], 'Đang được dùng.'], ['The results ___ in the next group meeting.', ['will be discussed', 'will discuss', 'are discuss'], 'Tương lai bị động.'], ['The thickness ___ by ellipsometry.', ['was measured', 'measured', 'was measure'], 'V3: measured.']],
    speak: [['Mô tả: các mẫu được ủ ở 400 độ trong một giờ.', 'The samples were annealed at 400 degrees for one hour.', 'were annealed/was annealed'], ['Báo: máy sputter đang được sửa.', 'The sputter tool is being repaired.', 'is being repaired/is being fixed'], ['Thông báo: phòng giặt sẽ đóng cửa vào thứ Bảy.', 'The laundry room will be closed on Saturday.', 'will be closed']],
  },
  {
    id: 'g-gerund', level: 3, emoji: '🔤', title: 'Gerund vs infinitive', titleVi: 'V-ing hay to V?',
    need: 'Sau một số động từ phải dùng V-ing, số khác dùng to V – sai là nghe rất “Tây-không-chuẩn”.',
    when: [
      '<b>+ V-ing</b>: enjoy, avoid, finish, mind, suggest, consider, keep, practice, spend time, look forward to, be used to, after/before/without + V-ing.',
      '<b>+ to V</b>: want, plan, decide, hope, need, agree, refuse, manage, afford, would like, try (cố gắng).',
      'Đổi nghĩa: stop doing (ngừng làm) vs stop to do (dừng lại để làm) · remember doing (nhớ đã làm) vs remember to do (nhớ phải làm) · try doing (thử) vs try to do (cố gắng).',
      'Sau giới từ luôn là V-ing: “I’m interested in working at TSMC.”',
    ],
    form: [['Sau giới từ', 'in/on/at/about/of/for/without + V-ing'], ['look forward to', 'to ở đây là giới từ → look forward to meeting you']],
    signals: 'Học theo cụm (chunk): “enjoy cooking”, “decide to apply”, “look forward to hearing”.',
    mistakes: [['I look forward to hear from you.', 'I look forward to hearing from you.', '“to” là giới từ.'], ['I enjoy to cook.', 'I enjoy cooking.', 'enjoy + V-ing.'], ['I suggest to use a dummy wafer.', 'I suggest using a dummy wafer.', 'suggest + V-ing.']],
    examples: [['I’m considering applying for a PhD.', 'Mình đang cân nhắc nộp đơn PhD.'], ['Remember to log out of the tool.', 'Nhớ đăng xuất khỏi máy.'], ['I can’t afford to eat out every day.', 'Mình không đủ tiền ăn ngoài mỗi ngày.']],
    quiz: [['Would you mind ___ the window?', ['opening', 'to open', 'open'], 'mind + V-ing.'], ['We decided ___ the experiment.', ['to repeat', 'repeating', 'repeat'], 'decide + to V.'], ['I’m interested in ___ in Taiwan after graduation.', ['working', 'to work', 'work'], 'Sau giới từ → V-ing.'], ['Don’t forget ___ your gloves.', ['to change', 'changing', 'change'], 'forget to do = quên phải làm.']],
    speak: [['Nói rằng bạn thích nấu đồ ăn Việt cho bạn bè.', 'I enjoy cooking Vietnamese food for my friends.', 'enjoy cooking'], ['Đề xuất dùng wafer thử trước.', 'I suggest using a dummy wafer first.', 'suggest using/how about using'], ['Kết thúc email: mong sớm nhận phản hồi của thầy.', 'I look forward to hearing from you.', 'look forward to hearing']],
  },
  {
    id: 'g-relative', level: 3, emoji: '🔗', title: 'Relative clauses', titleVi: 'Mệnh đề quan hệ (who, which, that, where)',
    need: 'Nối câu cho mượt, mô tả người/vật chính xác – tăng điểm “range of grammar” trong IELTS.',
    when: [
      '<b>who</b> (người), <b>which</b> (vật), <b>that</b> (người/vật, trong mệnh đề xác định), <b>where</b> (nơi chốn), <b>whose</b> (của ai).',
      'Mệnh đề xác định (không phẩy): cần để biết là ai/cái gì. “The student who sits next to me is from India.”',
      'Mệnh đề không xác định (có phẩy): thêm thông tin, KHÔNG dùng that. “My advisor, who studied in the US, is very strict.”',
      'Khi đại từ là tân ngữ, có thể bỏ trong văn nói: “The paper (that) you sent is great.”',
    ],
    form: [['Xác định', 'N + who/which/that + V…'], ['Không xác định', 'N, who/which + V…, …'], ['Nơi chốn', 'the place where + S + V']],
    signals: 'Người → who · Vật → which/that · Nơi → where',
    mistakes: [['The man which helped me is a technician.', 'The man who helped me is a technician.', 'Người → who.'], ['My lab, that is on the 5th floor, is new.', 'My lab, which is on the 5th floor, is new.', 'Có phẩy → không dùng that.'], ['This is the lab where I work in.', 'This is the lab where I work.', 'where đã bao gồm giới từ.']],
    examples: [['The tool that we use for etching is down.', 'Cái máy mà tụi mình dùng để khắc đang hỏng.'], ['Hsinchu, which is called the windy city, has a big science park.', 'Tân Trúc, nơi được gọi là thành phố gió, có khu công nghệ lớn.'], ['That’s the café where we usually study.', 'Đó là quán cà phê nơi tụi mình hay học.']],
    quiz: [['The professor ___ teaches Device Physics is from Germany.', ['who', 'which', 'where'], 'Người → who.'], ['This is the restaurant ___ we had dinner last week.', ['where', 'which', 'who'], 'Nơi chốn.'], ['My roommate, ___ is from Japan, cooks really well.', ['who', 'that', 'which'], 'Có phẩy + người → who.'], ['The sample ___ you gave me was contaminated.', ['(that)', 'who', 'where'], 'Tân ngữ, có thể bỏ that.']],
    speak: [['Giới thiệu: đây là anh kỹ thuật viên người đã sửa máy cho mình.', 'This is the technician who fixed the tool for me.', 'who'], ['Nói: Đài Loan, nơi mình đang học, có đồ ăn đường phố rất ngon.', "Taiwan, where I'm studying now, has amazing street food.", 'where'], ['Nói: bài báo mà giáo sư gửi rất khó hiểu.', 'The paper that the professor sent is really hard to understand.', 'that/which/the professor sent']],
  },
  {
    id: 'g-reported', level: 3, emoji: '📣', title: 'Reported speech', titleVi: 'Câu tường thuật (kể lại lời người khác)',
    need: 'Kể lại giáo sư nói gì, bạn cùng phòng hỏi gì – dùng hằng ngày và trong báo cáo.',
    when: [
      'Kể lại câu nói: thường lùi thì một bậc: is → was, will → would, can → could, hiện tại → quá khứ, quá khứ → had + V3 (nói nhanh thường giữ quá khứ đơn).',
      'Nếu điều đó vẫn còn đúng, có thể không lùi thì: “He said the tool is down.”',
      'Kể câu hỏi: asked + if/whether / wh- + S + V (không đảo, không do/did). “She asked if I was free.”',
      'Kể yêu cầu: told/asked + someone + to V. “He told me to repeat the measurement.”',
    ],
    form: [['Câu kể', 'S + said (that) + S + V(lùi thì) · told + someone + (that)…'], ['Câu hỏi', 'asked + (me) + if/whether/wh- + S + V'], ['Mệnh lệnh', 'told/asked + O + (not) to V']],
    signals: 'said / told / asked / mentioned / explained',
    mistakes: [['He said me that he was busy.', 'He told me (that) he was busy. / He said (that) he was busy.', 'said không đi trực tiếp với tân ngữ người.'], ['She asked me where do I live.', 'She asked me where I lived.', 'Câu hỏi tường thuật không đảo, không do.'], ['The professor told to me repeat it.', 'The professor told me to repeat it.', 'told + O + to V.']],
    examples: [['My advisor said the results looked promising.', 'Giáo sư nói kết quả có vẻ khả quan.'], ['The technician asked if I had checked the O-ring.', 'Kỹ thuật viên hỏi mình đã kiểm tra O-ring chưa.'], ['She told me not to touch the wafer.', 'Chị ấy dặn mình đừng chạm vào wafer.']],
    quiz: [['He ___ me that the meeting was cancelled.', ['told', 'said', 'asked'], 'told + người.'], ['She asked me ___ I was coming to the party.', ['if', 'that', 'do'], 'Câu hỏi Yes/No → if.'], ['The professor told me ___ the data again.', ['to check', 'check', 'checking'], 'told + O + to V.'], ['He asked where ___.', ['I lived', 'did I live', 'do I live'], 'Không đảo.']],
    speak: [['Kể lại: giáo sư nói kết quả rất hứa hẹn.', 'My professor said the results were very promising.', 'said; were/are'], ['Kể lại: kỹ thuật viên dặn mình không được mở cửa khi đang phơi sáng.', 'The technician told me not to open the door during exposure.', 'told me not to'], ['Kể lại: bạn cùng phòng hỏi mình có rảnh tối nay không.', 'My roommate asked if I was free tonight.', 'asked; if/whether']],
  },
  {
    id: 'g-usedto', level: 2, emoji: '🕰️', title: 'used to / be used to / get used to', titleVi: 'Thói quen cũ & đã quen với',
    need: 'Kể về cuộc sống trước khi sang Đài Loan và việc thích nghi – chủ đề IELTS rất phổ biến.',
    when: [
      '<b>used to + V</b>: thói quen/tình trạng trong quá khứ nay không còn. “I used to drink coffee every day.”',
      '<b>be used to + V-ing/N</b>: đã quen với. “I’m used to the humid weather now.”',
      '<b>get used to + V-ing/N</b>: dần quen với (quá trình). “I’m still getting used to eating dinner at 5.”',
    ],
    form: [['used to', 'S + used to + V · didn’t use to + V · Did + S + use to + V?'], ['be/get used to', 'S + be/get + used to + V-ing / danh từ']],
    signals: 'Ngày xưa/hồi trước → used to · quen rồi → be used to · đang dần quen → get used to',
    mistakes: [['I am used to wake up early.', 'I am used to waking up early.', 'be used to + V-ing.'], ['I use to live in Hanoi.', 'I used to live in Hanoi.', 'Nhớ “-d”.'], ['I didn’t used to like spicy food.', 'I didn’t use to like spicy food.', 'Sau didn’t → use.']],
    examples: [['I used to be really shy.', 'Ngày trước mình rất nhút nhát.'], ['I’m used to working late in the lab.', 'Mình quen làm muộn trong lab rồi.'], ['It took me months to get used to the scooters.', 'Mất mấy tháng mình mới quen với xe máy ở đây.']],
    quiz: [['When I was a kid, I ___ play football every afternoon.', ['used to', 'am used to', 'use to'], 'Thói quen quá khứ.'], ['I’m finally used to ___ with chopsticks.', ['eating', 'eat', 'ate'], 'be used to + V-ing.'], ['She is still getting used to ___ in a cleanroom suit.', ['working', 'work', 'worked'], 'get used to + V-ing.'], ['Did you ___ live near the sea?', ['use to', 'used to', 'using to'], 'Câu hỏi: Did … use to.']],
    speak: [['Kể: hồi ở Việt Nam bạn từng đi làm bằng xe máy.', 'In Vietnam, I used to ride a motorbike to work.', 'used to'], ['Nói: giờ bạn đã quen với thời tiết nóng ẩm ở đây.', "I'm used to the hot and humid weather here now.", "i'm used to/i am used to/i've got used to"], ['Nói: bạn vẫn đang dần quen với việc nói tiếng Anh mỗi ngày.', "I'm still getting used to speaking English every day.", 'getting used to speaking']],
  },
]

// ĐỘNG TỪ BẤT QUY TẮC hay dùng nhất khi nói (V1 | V2 | V3 | nghĩa)
export const irregularVerbs = `
be|was/were|been|thì, là
become|became|become|trở thành
begin|began|begun|bắt đầu
break|broke|broken|làm vỡ, hỏng
bring|brought|brought|mang đến
build|built|built|xây
buy|bought|bought|mua
catch|caught|caught|bắt, mắc (bệnh)
choose|chose|chosen|chọn
come|came|come|đến
cost|cost|cost|có giá
cut|cut|cut|cắt
do|did|done|làm
draw|drew|drawn|vẽ
drink|drank|drunk|uống
drive|drove|driven|lái xe
eat|ate|eaten|ăn
fall|fell|fallen|ngã, rơi
feel|felt|felt|cảm thấy
find|found|found|tìm thấy
fly|flew|flown|bay
forget|forgot|forgotten|quên
get|got|got/gotten|nhận, trở nên
give|gave|given|cho
go|went|gone|đi
grow|grew|grown|lớn lên, trồng
have|had|had|có
hear|heard|heard|nghe
hold|held|held|cầm, tổ chức
keep|kept|kept|giữ
know|knew|known|biết
leave|left|left|rời đi
lend|lent|lent|cho mượn
let|let|let|để cho
lose|lost|lost|mất, thua
make|made|made|làm, tạo ra
mean|meant|meant|có nghĩa là
meet|met|met|gặp
pay|paid|paid|trả tiền
put|put|put|đặt
read|read|read|đọc
ride|rode|ridden|đi (xe đạp, xe máy)
ring|rang|rung|reo
run|ran|run|chạy
say|said|said|nói
see|saw|seen|thấy
sell|sold|sold|bán
send|sent|sent|gửi
set|set|set|cài đặt, thiết lập
shut|shut|shut|đóng
sit|sat|sat|ngồi
sleep|slept|slept|ngủ
speak|spoke|spoken|nói
spend|spent|spent|tiêu, dành
stand|stood|stood|đứng
steal|stole|stolen|ăn cắp
swim|swam|swum|bơi
take|took|taken|lấy, mang
teach|taught|taught|dạy
tell|told|told|kể, bảo
think|thought|thought|nghĩ
throw|threw|thrown|ném
understand|understood|understood|hiểu
wake|woke|woken|thức dậy
wear|wore|worn|mặc
win|won|won|thắng
write|wrote|written|viết`
  .trim()
  .split('\n')
  .map((l) => {
    const [v1, v2, v3, vi] = l.split('|')
    return { v1, v2, v3, vi }
  })

// Bảng tóm tắt các thì hay dùng khi nói
export const tenseTable = [
  { name: 'Hiện tại đơn', form: 'V / V-s', use: 'Thói quen, sự thật, lịch trình', ex: 'I go to the lab every day.', lesson: 'g-present' },
  { name: 'Hiện tại tiếp diễn', form: 'am/is/are + V-ing', use: 'Đang xảy ra; dạo này; lịch hẹn tương lai', ex: "I'm writing my thesis these days.", lesson: 'g-present' },
  { name: 'Quá khứ đơn', form: 'V-ed / V2', use: 'Đã xong ở thời điểm xác định', ex: 'I met him yesterday.', lesson: 'g-past' },
  { name: 'Quá khứ tiếp diễn', form: 'was/were + V-ing', use: 'Đang làm thì bị xen ngang; bối cảnh', ex: 'I was cooking when he called.', lesson: 'g-past' },
  { name: 'Hiện tại hoàn thành', form: 'have/has + V3', use: 'Trải nghiệm, kết quả bây giờ, kéo dài đến nay', ex: "I've lived here for two years.", lesson: 'g-perfect' },
  { name: 'Tương lai đơn', form: 'will + V', use: 'Quyết định tức thì, hứa, dự đoán', ex: "I'll help you.", lesson: 'g-future' },
  { name: 'Dự định (be going to)', form: 'am/is/are going to + V', use: 'Dự định có trước; dự đoán có dấu hiệu', ex: "I'm going to apply for a PhD.", lesson: 'g-future' },
  { name: 'Quá khứ hoàn thành', form: 'had + V3', use: 'Xảy ra TRƯỚC một việc khác trong quá khứ; điều kiện loại 3', ex: 'The tool had broken before I arrived.', lesson: 'g-cond2' },
]

// "Chọn thì nào?" – cây hỏi–đáp
export const tenseTree = {
  start: { q: 'Việc bạn muốn nói xảy ra khi nào?', opts: [['Quá khứ (đã xảy ra)', 'past'], ['Hiện tại / nói chung', 'present'], ['Tương lai', 'future'], ['Tưởng tượng / giả định', 'unreal']] },
  past: { q: 'Bạn có nói (hoặc người nghe biết) THỜI ĐIỂM cụ thể không? (yesterday, last week, in 2023…)', opts: [['Có thời điểm cụ thể', 'pastWhen'], ['Không, điều quan trọng là kết quả/trải nghiệm bây giờ', 'R:perfect'], ['Bắt đầu trong quá khứ và VẪN còn tiếp diễn', 'R:perfectFor']] },
  pastWhen: { q: 'Đó là một hành động trọn vẹn, hay đang diễn ra thì có việc khác xen vào?', opts: [['Hành động trọn vẹn / chuỗi sự kiện', 'R:pastSimple'], ['Đang diễn ra (bối cảnh, bị xen ngang)', 'R:pastCont'], ['Xảy ra TRƯỚC một việc khác trong quá khứ', 'R:pastPerfect']] },
  present: { q: 'Đó là thói quen/sự thật, hay việc đang diễn ra?', opts: [['Thói quen, sự thật, lịch cố định', 'R:presentSimple'], ['Đang diễn ra lúc nói / tạm thời dạo này', 'R:presentCont'], ['Trạng thái: know, like, want, need…', 'R:stative']] },
  future: { q: 'Bạn quyết định việc này khi nào?', opts: [['Ngay lúc đang nói (hoặc hứa, đề nghị giúp)', 'R:will'], ['Đã định từ trước', 'R:goingTo'], ['Đã hẹn lịch cụ thể (giờ, người)', 'R:arranged'], ['Đang đoán điều sẽ xảy ra', 'futurePredict']] },
  futurePredict: { q: 'Có dấu hiệu rõ ràng ngay trước mắt không?', opts: [['Có (Look at the clouds…)', 'R:goingTo'], ['Không, chỉ là ý kiến/niềm tin (I think…, probably)', 'R:will']] },
  unreal: { q: 'Bạn tưởng tượng về hiện tại/tương lai hay tiếc nuối quá khứ?', opts: [['Hiện tại/tương lai (If I were…, I wish I had…)', 'R:cond2'], ['Quá khứ đã lỡ (If I had known…)', 'R:cond3']] },
  results: {
    perfect: ['Hiện tại hoàn thành', 'have/has + V3', "I've finished the slides. / Have you ever been to Japan?", 'g-perfect'],
    perfectFor: ['Hiện tại hoàn thành (+ for/since)', 'have/has + V3 (+ for/since)', "I've lived in Taiwan since 2024.", 'g-perfect'],
    pastSimple: ['Quá khứ đơn', 'V-ed / V2', 'I met my advisor yesterday.', 'g-past'],
    pastCont: ['Quá khứ tiếp diễn', 'was/were + V-ing', 'I was etching the wafer when the alarm went off.', 'g-past'],
    pastPerfect: ['Quá khứ hoàn thành', 'had + V3', 'When I arrived, the tool had already broken down.', 'g-cond2'],
    presentSimple: ['Hiện tại đơn', 'V / V-s', 'The shuttle leaves at 8:10.', 'g-present'],
    presentCont: ['Hiện tại tiếp diễn', 'am/is/are + V-ing', "I'm running an experiment right now.", 'g-present'],
    stative: ['Hiện tại đơn (động từ trạng thái)', 'V / V-s (không -ing)', 'I know what you mean.', 'g-present'],
    will: ['will + V', "will ('ll) + V", "I'll send it to you now. / I think it'll rain.", 'g-future'],
    goingTo: ['be going to + V', 'am/is/are going to + V', "I'm going to apply for a PhD.", 'g-future'],
    arranged: ['Hiện tại tiếp diễn (lịch hẹn)', 'am/is/are + V-ing', "I'm meeting my professor at 3.", 'g-future'],
    cond2: ['Điều kiện loại 2 / wish', 'If + V2, would + V', "If I had more time, I'd learn Japanese.", 'g-cond2'],
    cond3: ['Điều kiện loại 3', 'If + had V3, would have V3', "If I had checked, I wouldn't have ruined it.", 'g-cond2'],
  },
}
