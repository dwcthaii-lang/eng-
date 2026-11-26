// TẦNG 3: Sự nghiệp & giao tiếp chuyên nghiệp (hội thảo, phỏng vấn, đối tác, fab, bảo vệ luận văn)
export const careerSituations = [
  {
    id: 'car-conference', tier: 3, emoji: '🎤', title: 'Conference Q&A', titleVi: 'Trả lời câu hỏi ở hội thảo',
    recall: [
      {
        id: 'car-conference-1',
        vi: 'Có người hỏi một câu khó ở hội thảo. Cảm ơn câu hỏi, nói rằng đó là điểm hay và xin nhắc lại câu hỏi để chắc mình hiểu đúng.',
        context: 'Phiên poster/oral ở hội nghị quốc tế, một giáo sư Nhật hỏi về độ ổn định của linh kiện.',
        chunks: [{ en: "that's a great question", vi: 'câu hỏi rất hay' }, { en: 'just to make sure I understand', vi: 'để chắc là tôi hiểu đúng' }, { en: "you're asking about", vi: 'ý anh/chị là hỏi về' }],
        model: "Thank you, that's a great question. Just to make sure I understand, you're asking about the long-term stability of the device, right?",
      },
      {
        id: 'car-conference-2',
        vi: 'Bạn chưa có dữ liệu để trả lời. Thừa nhận thẳng thắn, nói đó là hướng nghiên cứu tiếp theo và mời trao đổi thêm sau phiên.',
        context: 'Câu hỏi về độ tin cậy ở nhiệt độ cao, phần bạn chưa đo.',
        chunks: [{ en: "we haven't looked into", vi: 'chúng tôi chưa xem xét' }, { en: 'future work', vi: 'hướng nghiên cứu tiếp theo' }, { en: 'happy to discuss', vi: 'rất sẵn lòng trao đổi' }],
        model: "Honestly, we haven't looked into high-temperature reliability yet. That's part of our future work, but I'd be happy to discuss it after the session.",
      },
    ],
    listening: {
      speakers: { A: 'Dr. Tanaka', B: 'Minh' },
      gistVi: 'Dr. Tanaka hỏi vì sao chọn HfO2 thay cho SiO2 và về độ trôi điện áp ngưỡng; Minh giải thích hằng số điện môi cao, độ trôi nhỏ sau 1000 giây, và hẹn gửi thêm dữ liệu qua email.',
      keyPoints: ['Hỏi vì sao dùng HfO2 thay SiO2', 'Vì hằng số điện môi cao → lớp dày hơn, ít dòng rò', 'Độ trôi điện áp ngưỡng nhỏ sau 1000 giây', 'Hẹn gửi thêm dữ liệu qua email'],
      chunks: [{ en: 'threshold voltage shift', vi: 'độ trôi điện áp ngưỡng' }, { en: 'high-k dielectric', vi: 'điện môi hằng số cao' }, { en: "I'll follow up by email", vi: 'tôi sẽ gửi thêm qua email' }],
      lines: [
        { s: 'A', t: "Nice *talk*. [[Could you|cudja,could you|could you → /ˈkʊdʒə/: /d/ + /j/ thành /dʒ/]] explain *why* you chose *HfO2* instead of *silicon* *dioxide*?" },
        { s: 'B', t: "*Sure*. HfO2 is a *high-k* dielectric, so we can use a *thicker* layer and [[cut down on|cuddown on,cut down on|cut down on → /kʌdaʊnɒn/: /t/ thành âm vỗ, nối âm]] the *leakage*." },
        { s: 'A', t: "I *see*. And what about the *threshold* voltage *shift* under *stress*?" },
        { s: 'B', t: "It was *pretty* *small*, [[about a|abouta,about a|about a → /əbaʊdə/: /t/ thành âm vỗ nối sang 'a']] *hundred* *millivolts* after a *thousand* *seconds*." },
        { s: 'A', t: "*Interesting*. [[Do you have|d'you have,do you have|do you have → /djuːhæv/: 'do' rút gọn]] *data* at *higher* *temperatures*?" },
        { s: 'B', t: "Not in this *paper*, but I'll *follow* *up* by *email* with *what* we have *so* *far*." },
      ],
    },
    roleplay: {
      aiName: 'Dr. Tanaka', aiRoleEn: 'a senior researcher from a Japanese university asking sharp but polite questions after the learner\'s conference presentation on HfO2-gated thin-film transistors', roleVi: 'Nhà nghiên cứu hỏi ở hội thảo',
      setupEn: 'Q&A session right after the learner\'s 12-minute oral presentation at an international semiconductor conference.',
      goalVi: 'Trả lời rõ ràng, thừa nhận điểm chưa làm một cách chuyên nghiệp, giữ liên lạc.',
      turns: [
        { ai: "Thank you for the talk. Why did you choose HfO2 rather than a more conventional gate oxide?", hint: ['high-k', 'leakage', 'thicker layer'], model: "Because HfO2 is a high-k material, we can use a thicker layer, which reduces the leakage current." },
        { ai: "Okay. How stable were the devices under bias stress?", hint: ['threshold voltage shift', 'after', 'seconds'], model: "They were fairly stable. The threshold voltage shift was only about 0.1 volts after a thousand seconds." },
        { ai: "Did you test them at elevated temperatures?", hint: ["haven't looked into", 'future work'], model: "Not yet. We haven't looked into high-temperature behavior, but it's part of our future work." },
        { ai: "I see. I'd be interested in your follow-up results.", hint: ['follow up', 'email', 'business card'], model: "Thank you! Could I have your email? I'll follow up once we have the new data." },
      ],
    },
  },
  {
    id: 'car-interview', tier: 3, emoji: '💼', title: 'Internship interview at a fab', titleVi: 'Phỏng vấn thực tập ở công ty bán dẫn',
    recall: [
      {
        id: 'car-interview-1',
        vi: 'Giới thiệu bản thân trong 2 câu: bạn là học viên thạc sĩ năm 2 ngành kỹ thuật bán dẫn, nghiên cứu về transistor màng mỏng, có kinh nghiệm làm trong phòng sạch.',
        context: 'Người phỏng vấn ở công ty bán dẫn: "So, tell me a little about yourself."',
        chunks: [{ en: "I'm a second-year master's student", vi: 'tôi là học viên thạc sĩ năm hai' }, { en: 'my research focuses on', vi: 'nghiên cứu của tôi tập trung vào' }, { en: 'hands-on experience', vi: 'kinh nghiệm thực hành' }],
        model: "I'm a second-year master's student in semiconductor engineering. My research focuses on thin-film transistors, and I have hands-on experience with cleanroom processes like ALD and sputtering.",
      },
      {
        id: 'car-interview-2',
        vi: 'Kể về một lần giải quyết vấn đề: máy đo cho kết quả lạ, bạn tìm ra nguyên nhân là đầu dò bị bẩn và lập checklist để tránh lặp lại.',
        context: 'Câu hỏi hành vi: "Tell me about a time you solved a technical problem."',
        chunks: [{ en: 'I noticed that', vi: 'tôi nhận thấy' }, { en: 'it turned out', vi: 'hoá ra là' }, { en: 'to prevent it from happening again', vi: 'để tránh lặp lại' }],
        model: "I noticed that our I-V curves were really noisy. It turned out the probe tips were contaminated, so I cleaned them and made a checklist to prevent it from happening again.",
      },
    ],
    listening: {
      speakers: { A: 'Ms. Lin (HR)', B: 'Minh' },
      gistVi: 'Phỏng vấn thực tập: hỏi vì sao chọn công ty, có làm ca được không; Minh muốn học quy trình sản xuất thật, làm ca được; thực tập 6 tháng bắt đầu tháng Bảy, sẽ có kết quả trong 2 tuần.',
      keyPoints: ['Vì sao muốn thực tập ở công ty', 'Có thể làm theo ca', 'Thực tập 6 tháng, bắt đầu tháng Bảy', 'Có kết quả trong khoảng 2 tuần'],
      chunks: [{ en: 'work in shifts', vi: 'làm theo ca' }, { en: 'mass production', vi: 'sản xuất hàng loạt' }, { en: 'get back to you', vi: 'phản hồi lại cho bạn' }],
      lines: [
        { s: 'A', t: "*So*, [[what made you|whatmadeya,what made you|what made you → /wɒtmeɪdʒə/: /d/ + /j/ thành /dʒ/]] *apply* for this *internship*?" },
        { s: 'B', t: "I *want* to see how *real* *mass* *production* works, not just *lab*-scale *processes*." },
        { s: 'A', t: "*Good*. Are you *okay* with working in *shifts*? Some *weeks* are *night* *shifts*." },
        { s: 'B', t: "*Yes*, that's *fine*. I'm [[used to|useta,used to|used to → /ˈjuːstə/: 'd' câm, 'to' giảm]] *long* *hours* in the *cleanroom*." },
        { s: 'A', t: "*Great*. The *internship* is *six* *months*, [[starting in|startin' in,starting in|starting in → /stɑːtɪnɪn/: -ing giảm thành /ɪn/]] *July*." },
        { s: 'A', t: "We'll *get* *back* to you within *two* *weeks*. [[Do you have any|d'you have any,do you have any|do you have any → /djəhævəni/]] *questions* for *us*?" },
      ],
    },
    roleplay: {
      aiName: 'Ms. Lin', aiRoleEn: 'a friendly but professional HR interviewer at a large Taiwanese semiconductor manufacturer, interviewing for a 6-month process engineering internship', roleVi: 'Người phỏng vấn (HR)',
      setupEn: 'A 20-minute English interview for a process engineering internship.',
      goalVi: 'Giới thiệu bản thân, kể kinh nghiệm theo cấu trúc vấn đề–hành động–kết quả, hỏi lại nhà tuyển dụng.',
      turns: [
        { ai: "Thanks for coming in. Could you start by telling me a little about yourself?", hint: ["master's student", 'research focuses on', 'hands-on'], model: "Sure. I'm a second-year master's student in semiconductor engineering, and my research focuses on thin-film transistors." },
        { ai: "Can you tell me about a time you solved a technical problem?", hint: ['I noticed that', 'it turned out', 'prevent'], model: "Our measurements were noisy, and it turned out the probe tips were dirty. I cleaned them and made a checklist to prevent it from happening again." },
        { ai: "Why do you want to work for a manufacturer rather than stay in research?", hint: ['mass production', 'real-world', 'learn'], model: "I want to learn how processes work in real mass production and apply my lab experience to real-world problems." },
        { ai: "Great. Do you have any questions for me?", hint: ['what does a typical day', 'training', 'team'], model: "Yes, what does a typical day look like for an intern, and what kind of training do you provide?" },
      ],
    },
  },
  {
    id: 'car-vendor', tier: 3, emoji: '🤝', title: 'Call with an equipment vendor', titleVi: 'Gọi cho kỹ sư hãng thiết bị',
    recall: [
      {
        id: 'car-vendor-1',
        vi: 'Mô tả sự cố với kỹ sư hãng: máy ALD báo lỗi áp suất từ thứ Hai, bạn đã khởi động lại nhưng lỗi vẫn còn.',
        context: 'Cuộc gọi hỗ trợ kỹ thuật với kỹ sư hãng thiết bị ở Singapore.',
        chunks: [{ en: 'has been showing', vi: 'cứ báo (từ… đến giờ)' }, { en: 'pressure error', vi: 'lỗi áp suất' }, { en: 'the problem persists', vi: 'lỗi vẫn còn' }],
        model: "Our ALD tool has been showing a pressure error since Monday. We've restarted it twice, but the problem persists.",
      },
      {
        id: 'car-vendor-2',
        vi: 'Đề nghị kỹ sư hãng đến kiểm tra trong tuần này vì nhóm sắp có hạn nộp bài báo, và hỏi chi phí có nằm trong bảo hành không.',
        context: 'Kỹ sư hãng hỏi: "When would you like us to send someone?"',
        chunks: [{ en: 'as soon as possible', vi: 'càng sớm càng tốt' }, { en: 'we have a deadline coming up', vi: 'sắp đến hạn' }, { en: 'covered by the warranty', vi: 'được bảo hành chi trả' }],
        model: "As soon as possible, ideally this week, because we have a paper deadline coming up. Also, is the repair covered by the warranty?",
      },
    ],
    listening: {
      speakers: { A: 'Kevin (vendor)', B: 'Minh' },
      gistVi: 'Kỹ sư hãng đoán van áp suất bị hỏng; nhờ Minh gửi file log; sẽ cử người đến thứ Năm; còn bảo hành nên không mất phí linh kiện.',
      keyPoints: ['Có thể do van điều áp bị hỏng', 'Gửi file log của máy', 'Kỹ sư đến vào thứ Năm', 'Còn bảo hành, không tính phí linh kiện'],
      chunks: [{ en: 'log files', vi: 'file nhật ký máy' }, { en: 'send someone over', vi: 'cử người qua' }, { en: 'still under warranty', vi: 'vẫn còn bảo hành' }],
      lines: [
        { s: 'A', t: "From what you're *describing*, it *sounds* like the *pressure* *valve* [[might have|mighta,might have|might have → /maɪtə/: 'have' giảm thành /ə/]] *failed*." },
        { s: 'B', t: "That makes *sense*. [[What do you|whaddaya,what do you|what do you → /wɒdəjə/: nối & giảm âm]] *need* from *us*?" },
        { s: 'A', t: "Could you *send* me the *log* *files* from the *last* *three* *days*?" },
        { s: 'B', t: "*Sure*, I'll *send* them right *after* this *call*." },
        { s: 'A', t: "*Thanks*. I can [[send someone|sen' someone,send someone|send someone → /sensʌmwʌn/: /d/ bị nuốt giữa hai phụ âm]] *over* on *Thursday* *morning*." },
        { s: 'A', t: "And *don't* *worry*, your *tool* is *still* under *warranty*, so the *parts* are *free*." },
      ],
    },
    roleplay: {
      aiName: 'Kevin', aiRoleEn: 'a field service engineer from the equipment vendor, calm and methodical, troubleshooting an ALD tool over the phone', roleVi: 'Kỹ sư hãng thiết bị',
      setupEn: 'Technical support call: the lab\'s ALD tool keeps showing a pressure error.',
      goalVi: 'Mô tả sự cố chính xác, trả lời câu hỏi kỹ thuật, thống nhất lịch sửa và chi phí.',
      turns: [
        { ai: "Hi, this is Kevin from field service. What seems to be the problem?", hint: ['has been showing', 'pressure error', 'since'], model: "Hi Kevin. Our ALD tool has been showing a pressure error since Monday." },
        { ai: "Have you tried anything to fix it yet?", hint: ['restarted', 'checked', 'persists'], model: "We've restarted it twice and checked the gas lines, but the problem persists." },
        { ai: "Okay. Can you send me the log files?", hint: ['right after this call', 'which days'], model: "Sure, I'll send them right after this call. Do you need the logs from the whole week?" },
        { ai: "Yes, please. When would be a good time for an engineer to come by?", hint: ['as soon as possible', 'deadline', 'warranty'], model: "As soon as possible, ideally this week, because we have a deadline coming up. Is it covered by the warranty?" },
      ],
    },
  },
  {
    id: 'car-handover', tier: 3, emoji: '🔄', title: 'Shift handover in the fab', titleVi: 'Bàn giao ca trong nhà máy',
    recall: [
      {
        id: 'car-handover-1',
        vi: 'Bàn giao ca: hai lô wafer đang chờ khắc, máy khắc số 3 bị tạm dừng để bảo trì định kỳ, dự kiến chạy lại lúc 10 giờ tối.',
        context: 'Bàn giao ca lúc 8 giờ tối cho đồng nghiệp ca đêm.',
        chunks: [{ en: 'two lots are waiting for', vi: 'hai lô đang chờ' }, { en: 'down for preventive maintenance', vi: 'dừng để bảo trì định kỳ' }, { en: 'expected to be back up', vi: 'dự kiến chạy lại' }],
        model: "Two lots are waiting for etching. Etcher 3 is down for preventive maintenance and is expected to be back up around 10 p.m.",
      },
      {
        id: 'car-handover-2',
        vi: 'Nhắc đồng nghiệp: lô cuối có số hạt bụi hơi cao, đã ghi vào hệ thống; nếu tăng nữa thì báo kỹ sư quy trình ngay.',
        context: 'Cuối buổi bàn giao, đồng nghiệp hỏi: "Anything I should keep an eye on?"',
        chunks: [{ en: 'keep an eye on', vi: 'để ý / theo dõi' }, { en: 'particle count', vi: 'số hạt bụi' }, { en: 'escalate to', vi: 'báo lên (cấp trên/kỹ sư)' }],
        model: "Yes, keep an eye on the last lot. The particle count was a bit high, and I logged it in the system. If it goes up again, escalate to the process engineer right away.",
      },
    ],
    listening: {
      speakers: { A: 'Jason', B: 'Minh' },
      gistVi: 'Jason bàn giao ca: máy CVD số 2 vừa sửa xong cần chạy wafer thử trước; lô ưu tiên phải xong trước 6 giờ sáng; có cảnh báo nhiệt độ lúc 5 giờ chiều nhưng đã ổn.',
      keyPoints: ['Máy CVD số 2 vừa sửa xong, chạy wafer thử trước', 'Lô ưu tiên phải xong trước 6 giờ sáng', 'Có cảnh báo nhiệt độ lúc 5 giờ chiều, đã ổn định'],
      chunks: [{ en: 'dummy wafer', vi: 'wafer chạy thử' }, { en: 'hot lot', vi: 'lô ưu tiên gấp' }, { en: 'back to normal', vi: 'trở lại bình thường' }],
      lines: [
        { s: 'A', t: "*Okay*, quick *handover*. *CVD* *two* just came *back* from *repair*, so [[run a|runna,run a|run a → /rʌnə/: /n/ nối sang 'a']] *dummy* *wafer* *first*." },
        { s: 'B', t: "*Got* it. [[Anything else|anythin' else,anything else|anything else → /enɪθɪŋels/: /ŋ/ nối sang 'else']] I should *know*?" },
        { s: 'A', t: "*Yeah*, there's a *hot* *lot* in the *queue*. It *has* to be *done* by *six* a.m." },
        { s: 'B', t: "*Okay*. I'll *put* it [[at the|atthe,at the|at the → /ətðə/: /t/ không bật hơi]] *front* of the *line*." },
        { s: 'A', t: "*Also*, we [[got a|godda,got a|got a → /gɒdə/: /t/ thành âm vỗ]] *temperature* *alarm* around *five*, but it's *back* to *normal* *now*." },
      ],
    },
    roleplay: {
      aiName: 'Jason', aiRoleEn: 'a fab process technician on the day shift handing over to the learner, who takes the night shift; practical, fast-talking, uses fab jargon', roleVi: 'Đồng nghiệp ca ngày',
      setupEn: 'End-of-shift handover in a semiconductor fab.',
      goalVi: 'Nắm thông tin bàn giao, hỏi lại cho rõ, xác nhận việc ưu tiên.',
      turns: [
        { ai: "Hey, ready for the handover? CVD 2 just came back from repair.", hint: ['dummy wafer', 'first', 'should I'], model: "Yes. Should I run a dummy wafer first before production lots?" },
        { ai: "Yeah, definitely. Also there's a hot lot that has to be done by 6.", hint: ['front of the line', 'which lot'], model: "Got it. Which lot is it? I'll put it at the front of the line." },
        { ai: "Lot 4417. We had a temperature alarm around five, but it's fine now.", hint: ['what caused', 'keep an eye on'], model: "Do you know what caused the alarm? I'll keep an eye on the temperature tonight." },
        { ai: "Not sure, maybe the chiller. If it happens again, call the engineer on duty.", hint: ['escalate', 'log it'], model: "Okay, if it happens again I'll log it and escalate to the engineer on duty right away." },
      ],
    },
  },
]
