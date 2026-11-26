// Giải thích chi tiết cho phần Ngữ pháp
// QUIZ_EXPLAIN[câu hỏi] = { vi: nghĩa cả câu (đã điền đáp án đúng), why: [giải thích từng lựa chọn, CÙNG THỨ TỰ với options trong grammar.js – phần tử đầu là đáp án đúng] }
// FIX_VI[câu sai] = nghĩa tiếng Việt của câu đúng
export const QUIZ_EXPLAIN = {
  // ── Present simple vs continuous
  'She ___ in the cleanroom every morning.': {
    vi: 'Sáng nào cô ấy cũng làm việc trong phòng sạch.',
    why: [
      '“every morning” là dấu hiệu THÓI QUEN → hiện tại đơn. Chủ ngữ “she” là ngôi 3 số ít nên động từ thêm -s: work → works.',
      'Thiếu -s. Với he/she/it ở hiện tại đơn, động từ phải thêm -s/-es. “work” chỉ dùng với I/you/we/they.',
      'Sai cấu trúc: không ghép “is” với động từ nguyên mẫu. “is” chỉ đi với V-ing (is working – đang làm) hoặc tính từ/danh từ. Ở đây là thói quen nên không dùng tiếp diễn.',
    ],
  },
  'Shh! The professor ___ a call.': {
    vi: 'Suỵt! Giáo sư đang nghe điện thoại.',
    why: [
      '“Shh!” cho thấy việc ĐANG diễn ra ngay lúc nói → hiện tại tiếp diễn: is + V-ing (is taking).',
      '“takes” là hiện tại đơn – dùng cho thói quen (He takes calls in the morning). Không diễn tả việc đang xảy ra ngay lúc này.',
      'Vừa sai thì vừa sai ngôi: “the professor” là ngôi 3 số ít, và tình huống cần tiếp diễn chứ không phải hiện tại đơn.',
    ],
  },
  'I ___ what you mean.': {
    vi: 'Mình hiểu ý bạn rồi.',
    why: [
      '“know” là động từ TRẠNG THÁI (chỉ hiểu biết, không phải hành động) → dùng hiện tại đơn, kể cả khi nói về lúc này.',
      'Động từ trạng thái (know, like, want, need, understand…) gần như không chia tiếp diễn. Người bản xứ không nói “I am knowing”.',
      'Thiếu động từ chia: câu cần “I + động từ”. “knowing” (V-ing) không thể đứng một mình làm động từ chính.',
    ],
  },
  'These days I ___ a lot of papers for my thesis.': {
    vi: 'Dạo này mình đang đọc rất nhiều bài báo cho luận văn.',
    why: [
      '“These days” (dạo này) = việc TẠM THỜI đang diễn ra trong giai đoạn hiện tại → hiện tại tiếp diễn: am reading.',
      '“I read” (hiện tại đơn) là thói quen lâu dài, cố định. Câu này nhấn mạnh giai đoạn tạm thời “dạo này” (vì đang làm luận văn), nên tiếp diễn tự nhiên hơn.',
      'Sai ngôi: “reads” chỉ dùng cho he/she/it. Với “I” không bao giờ thêm -s.',
    ],
  },
  // ── Past
  'I ___ my wallet on the MRT yesterday.': {
    vi: 'Hôm qua mình làm rơi ví trên tàu MRT.',
    why: [
      '“yesterday” = thời điểm cụ thể đã kết thúc → quá khứ đơn. lose là động từ bất quy tắc: lose – lost – lost.',
      '“lose” là hiện tại. Có “yesterday” thì bắt buộc chia quá khứ – lỗi rất hay gặp vì tiếng Việt không chia động từ.',
      'Hiện tại hoàn thành (have lost) KHÔNG đi với mốc thời gian quá khứ cụ thể như yesterday, last week, ago.',
    ],
  },
  'We ___ dinner when the typhoon warning came.': {
    vi: 'Bọn mình đang ăn tối thì có cảnh báo bão.',
    why: [
      'Một việc ĐANG diễn ra (ăn tối) thì việc khác XEN VÀO (cảnh báo đến) → việc đang diễn ra dùng quá khứ tiếp diễn: were having.',
      '“had dinner when…” nghĩa là cảnh báo đến RỒI mới ăn (hai việc nối tiếp), không diễn tả “đang ăn thì…”.',
      '“have” là hiện tại, không khớp với “came” (quá khứ).',
    ],
  },
  '___ you finish the report last night?': {
    vi: 'Tối qua bạn làm xong báo cáo chưa?',
    why: [
      'Câu hỏi quá khứ đơn: Did + S + V nguyên mẫu (Did you finish…?). “last night” là mốc quá khứ.',
      '“Do” dùng cho câu hỏi hiện tại, không đi với “last night”.',
      '“Were” là động từ to be; sau “Were you” phải là V-ing hoặc tính từ (Were you finishing…? / Were you busy?), không đi với “finish” nguyên mẫu.',
    ],
  },
  'She didn’t ___ the meeting.': {
    vi: 'Cô ấy đã không đến dự cuộc họp.',
    why: [
      'Sau didn’t luôn dùng động từ NGUYÊN MẪU: didn’t attend. “did” đã mang thì quá khứ rồi.',
      'Chia quá khứ hai lần (didn’t + attended) là sai – lỗi rất phổ biến của người Việt.',
      'V-ing không đi sau didn’t. Chỉ dùng V-ing sau to be (wasn’t attending).',
    ],
  },
  // ── Present perfect
  'I ___ here since last September.': {
    vi: 'Mình sống ở đây từ tháng Chín năm ngoái (đến giờ).',
    why: [
      '“since + mốc thời gian” = bắt đầu trong quá khứ và VẪN còn đến nay → hiện tại hoàn thành: have lived.',
      '“lived” (quá khứ đơn) ngụ ý bây giờ KHÔNG còn sống ở đây nữa, và không đi với “since”.',
      '“live” (hiện tại đơn) không nối được quá khứ với hiện tại. “I live here since…” là lỗi điển hình của người Việt.',
    ],
  },
  'We ___ the new sample two days ago.': {
    vi: 'Bọn mình làm mẫu mới cách đây hai ngày.',
    why: [
      '“ago” = mốc thời gian quá khứ đã xác định → quá khứ đơn: made.',
      'Hiện tại hoàn thành không đi với “ago”, “yesterday”, “last…”. Có mốc cụ thể → quá khứ đơn.',
      '“make” là hiện tại, mâu thuẫn với “two days ago”.',
    ],
  },
  '___ you ever ___ bubble tea with cheese foam?': {
    vi: 'Bạn đã bao giờ uống trà sữa kem phô mai chưa?',
    why: [
      'Hỏi về TRẢI NGHIỆM trong đời (ever – đã bao giờ) → hiện tại hoàn thành: Have you ever + V3 (tried).',
      '“Did you ever try” có gặp trong văn nói Mỹ, nhưng chuẩn và tự nhiên nhất để hỏi trải nghiệm đến giờ là “Have you ever tried”. “Did” hợp hơn khi hỏi về một khoảng thời gian đã kết thúc (Did you try it when you were in Tainan?).',
      '“Do you ever try…?” hỏi về THÓI QUEN (bạn có hay thử… không), không phải trải nghiệm đã từng.',
    ],
  },
  'The tool is ready. The technician ___ fixed it.': {
    vi: 'Máy sẵn sàng rồi. Kỹ thuật viên vừa sửa xong.',
    why: [
      'Việc VỪA xong và kết quả còn thấy rõ (máy đã sẵn sàng) → has + just + V3. “just” đứng GIỮA has và V3.',
      'Sai vị trí: trạng từ “just/already/never” đứng sau trợ động từ has/have, không đứng trước.',
      '“did just fixed” sai hai lần: did + V3 không tồn tại; sau did phải là nguyên mẫu.',
    ],
  },
  // ── Future
  'A: We’re out of milk. B: Oh, I ___ some.': {
    vi: 'A: Nhà hết sữa rồi. B: À, để mình đi mua.',
    why: [
      'Quyết định NGAY LÚC NÓI (vừa nghe hết sữa mới quyết định) → will (’ll buy).',
      '“I’m buying” = kế hoạch đã sắp xếp từ trước. B chỉ vừa biết là hết sữa nên không thể có kế hoạch sẵn.',
      '“I buy” (hiện tại đơn) là thói quen, không dùng để đưa ra quyết định/đề nghị lúc nói.',
    ],
  },
  'I ___ my advisor at 2 p.m. tomorrow, it’s in the calendar.': {
    vi: 'Mai 2 giờ chiều mình gặp giáo sư hướng dẫn, đã ghi trong lịch rồi.',
    why: [
      'Lịch hẹn ĐÃ SẮP XẾP (có giờ, có trong lịch) → hiện tại tiếp diễn mang nghĩa tương lai: am meeting.',
      '“will meet maybe” mâu thuẫn: đã có lịch thì chắc chắn, không “maybe”; và “maybe” không đứng sau động từ như vậy.',
      '“I meet” (hiện tại đơn) chỉ dùng cho lịch trình cố định kiểu thời khoá biểu/tàu xe (The train leaves at 8), không dùng cho cuộc hẹn cá nhân.',
    ],
  },
  'Look at that sky! It ___ rain.': {
    vi: 'Nhìn trời kìa! Sắp mưa rồi.',
    why: [
      'Dự đoán dựa trên DẤU HIỆU thấy ngay trước mắt (bầu trời đen) → be going to.',
      'Sau will dùng nguyên mẫu, không có “to” (will rain). “will to” luôn sai.',
      '“It rains” là sự thật/thói quen (ở đây hay mưa), không phải dự đoán sắp xảy ra.',
    ],
  },
  'I promise I ___ be late again.': {
    vi: 'Mình hứa sẽ không đến muộn nữa.',
    why: [
      'Lời HỨA, cam kết → will / won’t. “won’t be late” = sẽ không muộn.',
      '“am not going” cần “to” (am not going to be) và thường nói về dự định, không mang sắc thái hứa hẹn.',
      '“don’t be late” là câu mệnh lệnh (đừng đến muộn), không dùng sau “I promise I”.',
    ],
  },
  // ── Questions
  'Where ___ you buy that jacket?': {
    vi: 'Bạn mua cái áo khoác đó ở đâu vậy?',
    why: [
      'Hỏi về việc đã xảy ra (đã mua rồi) → Wh- + did + S + V nguyên mẫu.',
      'Thừa “you” (câu đã có you) và “do” là hiện tại – hỏi thói quen (bạn hay mua ở đâu), không hợp với việc đã mua.',
      '“are” là to be, không đi với động từ nguyên mẫu “buy”.',
    ],
  },
  'Do you know where ___?': {
    vi: 'Bạn có biết nhà ga ở đâu không?',
    why: [
      'Câu hỏi GIÁN TIẾP (nằm sau Do you know / Could you tell me) → KHÔNG đảo: where + S + V (the station is).',
      'Đảo “is the station” chỉ dùng trong câu hỏi trực tiếp (Where is the station?). Ghép vào sau “Do you know” là lỗi rất phổ biến.',
      '“the station” số ít → is, không phải are.',
    ],
  },
  'How often ___ she go to the gym?': {
    vi: 'Cô ấy đi tập gym bao lâu một lần?',
    why: [
      'Câu hỏi hiện tại đơn với she → does + she + V nguyên mẫu (go).',
      '“do” dùng cho I/you/we/they.',
      '“is she go” sai: is không đi với động từ nguyên mẫu.',
    ],
  },
  '___ you ever been to Hualien?': {
    vi: 'Bạn đã bao giờ đến Hoa Liên chưa?',
    why: [
      '“been” là V3 → phải có “have”: Have you ever been to…? (trải nghiệm đã từng).',
      '“Did” đi với nguyên mẫu (Did you go…), không đi với “been”.',
      '“Do” đi với nguyên mẫu và hỏi thói quen hiện tại.',
    ],
  },
  // ── Modals
  'You look exhausted. You ___ get some sleep.': {
    vi: 'Trông bạn mệt lả rồi. Bạn nên ngủ một chút đi.',
    why: [
      'Đưa ra LỜI KHUYÊN → should + V nguyên mẫu.',
      'Sau động từ khuyết thiếu (must, should, can…) không có “to”. “must to” luôn sai.',
      '“might” = có thể sẽ (khả năng), không phải lời khuyên.',
    ],
  },
  'You ___ touch the wafer surface with bare hands.': {
    vi: 'Bạn không được chạm tay trần vào bề mặt wafer.',
    why: [
      'Quy định CẤM → mustn’t (không được phép).',
      '“don’t have to” = không cần phải (làm cũng được, không làm cũng được) – ngược hẳn nghĩa cấm.',
      'Sau should/shouldn’t không có “to”.',
    ],
  },
  'Tomorrow is a holiday, so we ___ go to the lab.': {
    vi: 'Mai là ngày nghỉ nên bọn mình không cần lên lab.',
    why: [
      'KHÔNG BẮT BUỘC (ngày nghỉ, muốn đi cũng được) → don’t have to.',
      '“mustn’t” = bị cấm đến lab – sai nghĩa.',
      'Sau can’t không có “to”; và “can’t” = không thể, không phải “không cần”.',
    ],
  },
  'His light is still on at 3 a.m. He ___ be working.': {
    vi: '3 giờ sáng mà đèn phòng anh ấy vẫn sáng. Chắc chắn anh ấy đang làm việc.',
    why: [
      'SUY LUẬN chắc chắn dựa trên bằng chứng → must be + V-ing (hẳn là đang…).',
      '“should be working” = đáng lẽ/lẽ ra nên đang làm việc – không phải suy luận từ bằng chứng.',
      '“has to” = bắt buộc phải, không dùng để suy đoán.',
    ],
  },
  // ── Articles
  'She’s ___ engineer at TSMC.': {
    vi: 'Cô ấy là kỹ sư ở TSMC.',
    why: [
      'Nghề nghiệp, danh từ đếm được số ít → cần a/an. “engineer” bắt đầu bằng ÂM nguyên âm /e/ → an.',
      '“a” dùng trước âm phụ âm (a doctor, a university /juː/). Quy tắc dựa vào ÂM đọc, không phải chữ cái.',
      '“the” chỉ một kỹ sư cụ thể đã biết. Giới thiệu nghề nghiệp thì dùng a/an.',
    ],
  },
  'Thanks for ___ feedback!': {
    vi: 'Cảm ơn góp ý của bạn nhé!',
    why: [
      'feedback cụ thể mà người kia vừa đưa → the (hoặc your). feedback là danh từ KHÔNG ĐẾM ĐƯỢC.',
      'Danh từ không đếm được không đi với “a”.',
      'Không đếm được nên cũng không đi với “an”.',
    ],
  },
  'I need some ___ about the visa.': {
    vi: 'Mình cần một ít thông tin về visa.',
    why: [
      '“information” KHÔNG ĐẾM ĐƯỢC → không có số nhiều, đi với some/a piece of.',
      'Không có dạng “informations” (giống advice, equipment, research, feedback).',
      'Không dùng a/an với danh từ không đếm được.',
    ],
  },
  'I bought a rice cooker. ___ rice cooker was cheap.': {
    vi: 'Mình mua một cái nồi cơm điện. Cái nồi đó rẻ lắm.',
    why: [
      'Nhắc lại lần thứ hai, người nghe đã biết là cái nào → the.',
      '“A rice cooker” lại thành một cái nồi KHÁC, chưa nhắc tới.',
      'Danh từ đếm được số ít không được đứng trơ không có mạo từ.',
    ],
  },
  // ── Comparison
  'Hsinchu is ___ than Taipei.': {
    vi: 'Tân Trúc nhiều gió hơn Đài Bắc.',
    why: [
      'Tính từ 2 âm tiết tận cùng -y → đổi y thành i + er: windy → windier.',
      '“more windy” không phải sai hẳn nhưng ít tự nhiên; tính từ -y ngắn ưu tiên -ier (busier, easier, windier).',
      'Phải đổi y → i: không có dạng “windyer”.',
    ],
  },
  'This is ___ bubble tea I’ve ever had.': {
    vi: 'Đây là ly trà sữa ngon nhất mình từng uống.',
    why: [
      '“ever had” → so sánh NHẤT. good bất quy tắc: good – better – the best.',
      '“the better” là so sánh hơn giữa 2 thứ, không dùng với “I’ve ever had”.',
      'good là bất quy tắc, không nói “most good”.',
    ],
  },
  'The second sample is ___ thinner than the first.': {
    vi: 'Mẫu thứ hai mỏng hơn mẫu đầu một chút.',
    why: [
      'Bổ nghĩa mức độ cho so sánh hơn: slightly / a bit / much / far + -er.',
      '“more thinner” là so sánh hai lần (thin đã có -er rồi).',
      '“very” không đứng trước so sánh hơn. Dùng much/far (nhiều) hoặc slightly (chút ít).',
    ],
  },
  'The more you practice, ___ you get.': {
    vi: 'Càng luyện nhiều bạn càng giỏi.',
    why: [
      'Cấu trúc “càng… càng”: The + so sánh hơn…, the + so sánh hơn… → the better.',
      'Thiếu “the” ở vế hai; cấu trúc này bắt buộc có the ở cả hai vế.',
      'Phải là so sánh HƠN (better), không phải so sánh nhất.',
    ],
  },
  // ── Conditionals 0/1
  'If you ___ the O-ring, the chamber will leak.': {
    vi: 'Nếu bạn không thay vòng đệm O-ring thì buồng sẽ bị rò.',
    why: [
      'Câu điều kiện loại 1: If + HIỆN TẠI ĐƠN, … will + V. Vế if dùng hiện tại dù nói về tương lai.',
      'Không dùng will trong vế if (lỗi rất phổ biến do dịch từ “nếu bạn sẽ không…”).',
      '“didn’t replace” là quá khứ → thuộc câu loại 2, không khớp với “will leak”.',
    ],
  },
  'I’ll send you the file when I ___ home.': {
    vi: 'Về đến nhà mình sẽ gửi file cho bạn.',
    why: [
      'Sau when/as soon as/before/after nói về tương lai → dùng HIỆN TẠI ĐƠN (when I get home).',
      'Không dùng will sau when trong mệnh đề thời gian.',
      '“got” là quá khứ, trong khi việc gửi file ở tương lai.',
    ],
  },
  'If you mix acid and water the wrong way, it ___ dangerous.': {
    vi: 'Nếu pha axit với nước sai cách thì sẽ nguy hiểm.',
    why: [
      'Sự thật/quy luật luôn đúng → điều kiện loại 0: If + hiện tại đơn, hiện tại đơn (it gets).',
      'Sau will dùng nguyên mẫu (will get), không phải “will got”.',
      '“got” là quá khứ, không hợp với quy luật chung.',
    ],
  },
  'We’ll miss the train ___ we leave now.': {
    vi: 'Mình sẽ lỡ tàu nếu không đi ngay bây giờ.',
    why: [
      'unless = if … not. “unless we leave now” = nếu không đi ngay.',
      '“if we leave now” → sẽ lỡ tàu NẾU đi ngay – ngược nghĩa.',
      '“when we leave now” vô nghĩa: when chỉ thời điểm, không phải điều kiện phủ định.',
    ],
  },
  // ── Conditionals 2/3
  'If I ___ you, I’d ask the technician first.': {
    vi: 'Nếu mình là bạn, mình sẽ hỏi kỹ thuật viên trước.',
    why: [
      'Điều kiện KHÔNG CÓ THẬT ở hiện tại (mình không thể là bạn) → loại 2. Với to be dùng “were” cho mọi ngôi: If I were you.',
      '“am” là thật ở hiện tại – không thể vì mình không phải là bạn.',
      'Không dùng would trong vế if.',
    ],
  },
  'If we ___ earlier, we would have caught the train.': {
    vi: 'Nếu bọn mình đi sớm hơn thì đã kịp tàu rồi.',
    why: [
      'Giả định trái với QUÁ KHỨ (thực tế đã đi muộn, lỡ tàu) → loại 3: If + had + V3, would have + V3.',
      '“left” là loại 2 (giả định hiện tại), không khớp với “would have caught”.',
      'Không dùng would trong vế if.',
    ],
  },
  'I wish I ___ Chinese better.': {
    vi: 'Ước gì mình nói tiếng Trung giỏi hơn.',
    why: [
      'Ước điều trái với HIỆN TẠI → wish + quá khứ đơn (spoke).',
      'Không dùng hiện tại sau wish khi ước điều không có thật.',
      'wish + will không dùng (muốn mong tương lai dùng hope: I hope I will…).',
    ],
  },
  'What would you do if you ___ the lottery?': {
    vi: 'Nếu trúng xổ số thì bạn sẽ làm gì?',
    why: [
      'Tưởng tượng (khó xảy ra) ở hiện tại/tương lai → loại 2: if + quá khứ đơn, would + V.',
      '“win” là loại 1 (có khả năng thật), không khớp với “would”.',
      '“had won” là loại 3 (quá khứ), phải đi với “would have done”.',
    ],
  },
  // ── Passive
  'The wafers ___ with acetone before deposition.': {
    vi: 'Các tấm wafer đã được làm sạch bằng acetone trước khi phủ màng.',
    why: [
      'Wafer không tự làm sạch mà ĐƯỢC làm sạch → bị động quá khứ: were + V3 (cleaned).',
      'Chủ động “cleaned” nghĩa là wafer tự đi làm sạch cái gì đó – vô lý.',
      '“clean” là tính từ (sạch) → “were clean” = đã sạch (trạng thái), không nói tới quy trình làm sạch.',
    ],
  },
  'The SEM ___ right now, please wait.': {
    vi: 'Máy SEM đang có người dùng, bạn đợi chút nhé.',
    why: [
      'Máy ĐANG ĐƯỢC dùng ngay lúc này → bị động tiếp diễn: is being + V3.',
      '“is using” chủ động = máy SEM đang dùng cái gì đó – sai nghĩa.',
      '“used” thiếu to be và sai thì.',
    ],
  },
  'The results ___ in the next group meeting.': {
    vi: 'Kết quả sẽ được thảo luận trong buổi họp nhóm tới.',
    why: [
      'Tương lai + bị động: will be + V3.',
      'Chủ động “will discuss” = kết quả sẽ thảo luận (cái gì đó) – kết quả không tự thảo luận được.',
      'Bị động cần V3: are discussed, không phải “are discuss”.',
    ],
  },
  'The thickness ___ by ellipsometry.': {
    vi: 'Độ dày được đo bằng phương pháp ellipsometry.',
    why: [
      'Độ dày ĐƯỢC đo → bị động: was + V3 (measured).',
      'Chủ động “measured” = độ dày đi đo (cái gì đó) – sai nghĩa.',
      'Bị động phải là V3: measured, không phải nguyên mẫu “measure”.',
    ],
  },
  // ── Gerund / infinitive
  'Would you mind ___ the window?': {
    vi: 'Bạn mở giúp mình cửa sổ được không?',
    why: [
      '“mind” luôn đi với V-ing: Would you mind opening…?',
      '“mind to do” không tồn tại.',
      'Cần V-ing, không phải nguyên mẫu.',
    ],
  },
  'We decided ___ the experiment.': {
    vi: 'Bọn mình quyết định làm lại thí nghiệm.',
    why: [
      '“decide” + to V (decide to repeat). Nhóm decide, plan, want, hope, agree, need đi với to V.',
      '“decide” không đi với V-ing.',
      'Thiếu “to”.',
    ],
  },
  'I’m interested in ___ in Taiwan after graduation.': {
    vi: 'Mình muốn làm việc ở Đài Loan sau khi tốt nghiệp.',
    why: [
      'Sau GIỚI TỪ (in, of, about, at…) luôn dùng V-ing: interested in working.',
      'Không dùng to V sau giới từ.',
      'Không dùng nguyên mẫu sau giới từ.',
    ],
  },
  'Don’t forget ___ your gloves.': {
    vi: 'Đừng quên thay găng tay nhé.',
    why: [
      'forget TO do = quên việc PHẢI làm (chưa làm) – đúng ý nhắc nhở.',
      'forget doing = quên là ĐÃ làm rồi (I’ll never forget meeting her) – sai ý.',
      'Thiếu “to”.',
    ],
  },
  // ── Relative clauses
  'The professor ___ teaches Device Physics is from Germany.': {
    vi: 'Thầy dạy môn Vật lý linh kiện là người Đức.',
    why: [
      'Thay cho NGƯỜI (the professor) làm chủ ngữ → who (hoặc that).',
      '“which” chỉ dùng cho vật/con vật.',
      '“where” thay cho nơi chốn.',
    ],
  },
  'This is the restaurant ___ we had dinner last week.': {
    vi: 'Đây là nhà hàng tuần trước bọn mình ăn tối.',
    why: [
      'Nơi chốn, sau đó là mệnh đề đầy đủ (we had dinner) → where = at which.',
      '“which” cần giới từ: the restaurant at which we had dinner, hoặc which … at. Không có giới từ thì thiếu.',
      '“who” chỉ dùng cho người.',
    ],
  },
  'My roommate, ___ is from Japan, cooks really well.': {
    vi: 'Bạn cùng phòng của mình, người Nhật, nấu ăn rất ngon.',
    why: [
      'Mệnh đề có DẤU PHẨY (thêm thông tin) + người → who.',
      '“that” KHÔNG dùng trong mệnh đề có dấu phẩy.',
      '“which” dùng cho vật.',
    ],
  },
  'The sample ___ you gave me was contaminated.': {
    vi: 'Mẫu bạn đưa mình bị nhiễm bẩn.',
    why: [
      'Vật làm TÂN NGỮ (you gave the sample) → that/which, và có thể bỏ hẳn: The sample you gave me…',
      '“who” chỉ dùng cho người.',
      '“where” chỉ dùng cho nơi chốn.',
    ],
  },
  // ── Reported speech
  'He ___ me that the meeting was cancelled.': {
    vi: 'Anh ấy bảo mình là cuộc họp bị huỷ rồi.',
    why: [
      '“tell” + NGƯỜI + that…: He told me that…',
      '“say” không đi trực tiếp với người: said that… hoặc said to me that…',
      '“asked” là hỏi, không hợp với “that + câu trần thuật”.',
    ],
  },
  'She asked me ___ I was coming to the party.': {
    vi: 'Cô ấy hỏi mình có đến bữa tiệc không.',
    why: [
      'Tường thuật câu hỏi Yes/No → if/whether.',
      '“that” dùng cho câu trần thuật, không phải câu hỏi.',
      'Câu tường thuật không đảo, không dùng trợ động từ do.',
    ],
  },
  'The professor told me ___ the data again.': {
    vi: 'Giáo sư bảo mình kiểm tra lại dữ liệu.',
    why: [
      'Tường thuật yêu cầu/mệnh lệnh: tell + O + to V.',
      'Thiếu “to”.',
      'tell + O + V-ing không dùng cho yêu cầu.',
    ],
  },
  'He asked where ___.': {
    vi: 'Anh ấy hỏi mình sống ở đâu.',
    why: [
      'Câu hỏi tường thuật: KHÔNG đảo, lùi thì → where I lived.',
      'Không dùng trật tự câu hỏi (did I live) trong câu tường thuật.',
      'Không đảo và phải lùi thì (live → lived).',
    ],
  },
  // ── used to
  'When I was a kid, I ___ play football every afternoon.': {
    vi: 'Hồi nhỏ chiều nào mình cũng đá bóng.',
    why: [
      'Thói quen trong QUÁ KHỨ (giờ không còn) → used to + V.',
      '“am used to” = quen với (hiện tại) và đi với V-ing – nghĩa khác hẳn.',
      'Câu khẳng định phải là “used”, không phải “use”.',
    ],
  },
  'I’m finally used to ___ with chopsticks.': {
    vi: 'Cuối cùng mình cũng quen ăn bằng đũa rồi.',
    why: [
      'be used to + V-ing = đã quen với việc gì (“to” ở đây là giới từ).',
      'Sau be used to không dùng nguyên mẫu.',
      'Không dùng quá khứ sau “to”.',
    ],
  },
  'She is still getting used to ___ in a cleanroom suit.': {
    vi: 'Cô ấy vẫn đang tập quen với việc làm việc trong bộ đồ phòng sạch.',
    why: [
      'get used to + V-ing = dần quen với việc gì.',
      'Không dùng nguyên mẫu (to là giới từ).',
      'Không dùng quá khứ.',
    ],
  },
  'Did you ___ live near the sea?': {
    vi: 'Trước đây bạn có từng sống gần biển không?',
    why: [
      'Câu hỏi/phủ định có did → “use to” (không -d), vì did đã mang thì quá khứ.',
      '“Did you used to” là lỗi phổ biến – chia quá khứ hai lần.',
      'Không có dạng “using to”.',
    ],
  },
}

export const FIX_VI = {
  'He work in a lab.': 'Anh ấy làm việc trong phòng thí nghiệm.',
  'I am agree.': 'Mình đồng ý.',
  'I’m usually going to the gym.': 'Mình thường đi tập gym.',
  'Yesterday I go to the clinic.': 'Hôm qua mình đi phòng khám.',
  'I didn’t went.': 'Mình đã không đi.',
  'When the power went out, I worked on the tool.': 'Lúc mất điện, mình đang làm việc với máy.',
  'I have seen him yesterday.': 'Hôm qua mình gặp anh ấy.',
  'I live here since 2024.': 'Mình sống ở đây từ năm 2024 (đến giờ).',
  'Did you ever try stinky tofu?': 'Bạn đã bao giờ ăn đậu phụ thối chưa?',
  'I will to go home.': 'Mình sẽ về nhà.',
  'Tomorrow I go to Taipei with my friends.': 'Mai mình đi Đài Bắc với bạn (đã lên kế hoạch).',
  'A: The phone is ringing. B: I’m going to answer it.': 'Để mình nghe máy cho.',
  'Where you live?': 'Bạn sống ở đâu?',
  'What time the meeting starts?': 'Mấy giờ cuộc họp bắt đầu?',
  'Could you tell me where is the restroom?': 'Bạn có thể chỉ mình nhà vệ sinh ở đâu không?',
  'You should to see a doctor.': 'Bạn nên đi khám bác sĩ.',
  'She can speaks English.': 'Cô ấy nói được tiếng Anh.',
  'You mustn’t come to the party.': 'Bạn không cần phải đến bữa tiệc đâu.',
  'I am student.': 'Mình là sinh viên.',
  'Can you give me some advices?': 'Bạn cho mình vài lời khuyên được không?',
  'The life in Taipei is convenient.': 'Cuộc sống ở Đài Bắc rất tiện.',
  'Taipei is more busy than Tainan.': 'Đài Bắc nhộn nhịp hơn Đài Nam.',
  'This sample is more better.': 'Mẫu này tốt hơn nhiều.',
  'He is the most tall in the lab.': 'Anh ấy cao nhất lab.',
  'If it will rain, I will stay home.': 'Nếu trời mưa, mình sẽ ở nhà.',
  'I’ll call you when I will arrive.': 'Đến nơi mình sẽ gọi cho bạn.',
  'Unless you don’t hurry, you’ll miss the bus.': 'Nếu không nhanh lên, bạn sẽ lỡ xe buýt.',
  'If I have more money, I would buy a car.': 'Nếu có nhiều tiền hơn, mình sẽ mua ô tô.',
  'If I would know, I would tell you.': 'Nếu mình biết thì mình đã nói với bạn rồi.',
  'If I studied harder last year, I would pass.': 'Nếu năm ngoái mình học chăm hơn thì đã đỗ rồi.',
  'The sample was anneal at 400 °C.': 'Mẫu được ủ nhiệt ở 400 °C.',
  'The tool is broke.': 'Máy bị hỏng rồi.',
  'It was happened yesterday.': 'Chuyện đó xảy ra hôm qua.',
  'I look forward to hear from you.': 'Mong sớm nhận được phản hồi của bạn.',
  'I enjoy to cook.': 'Mình thích nấu ăn.',
  'I suggest to use a dummy wafer.': 'Mình đề xuất dùng wafer thử (dummy wafer).',
  'The man which helped me is a technician.': 'Người đàn ông đã giúp mình là kỹ thuật viên.',
  'My lab, that is on the 5th floor, is new.': 'Lab của mình, ở tầng 5, mới xây.',
  'This is the lab where I work in.': 'Đây là lab nơi mình làm việc.',
  'He said me that he was busy.': 'Anh ấy nói (với mình) là anh ấy bận.',
  'She asked me where do I live.': 'Cô ấy hỏi mình sống ở đâu.',
  'The professor told to me repeat it.': 'Giáo sư bảo mình làm lại.',
  'I am used to wake up early.': 'Mình quen dậy sớm rồi.',
  'I use to live in Hanoi.': 'Trước đây mình từng sống ở Hà Nội.',
  'I didn’t used to like spicy food.': 'Trước đây mình không thích đồ cay.',
}
