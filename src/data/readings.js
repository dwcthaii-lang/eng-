// Bài đọc ngắn cho phần Đọc & Viết. Cụm từ trong {{...}} có thể bấm để thêm vào kho từ.
export const readings = [
  {
    id: 'r-dorm-notice', tier: 1, title: 'Dorm notice: Water outage', titleVi: 'Thông báo KTX: Cúp nước',
    text: `Dear residents, please be advised that there will be a {{scheduled water outage}} in Building B on Saturday from 9 a.m. to 3 p.m. due to {{pipe maintenance}}. We recommend that you {{store some water}} in advance. The laundry room will be {{temporarily closed}} during this period. We {{apologize for any inconvenience}} and thank you for your understanding. If you have any questions, please {{contact the dorm office}}.`,
    questions: ['When exactly will the water be cut off?', 'What should residents do before Saturday?'],
  },
  {
    id: 'r-dorm-rules', tier: 1, title: 'Shared kitchen guidelines', titleVi: 'Nội quy bếp chung',
    text: `To keep our shared kitchen clean and safe, please {{clean up after yourself}} immediately after cooking. All food in the refrigerator must be {{labeled with your name and date}}. Unlabeled items will be {{thrown away}} every Sunday night. Do not leave cooking {{unattended}}, and make sure the stove is {{turned off}} before you leave. Repeated violations may result in {{losing kitchen access}}.`,
    questions: ['What happens to unlabeled food?', 'What two safety rules are mentioned?'],
  },
  {
    id: 'r-abstract-hfo2', tier: 2, title: 'Abstract: HfO₂ gate dielectric TFTs', titleVi: 'Tóm tắt bài báo: TFT dùng điện môi HfO₂',
    text: `In this work, we {{demonstrate}} amorphous IGZO thin-film transistors with a solution-processed HfO₂ {{gate dielectric}}. After {{post-deposition annealing}} at 400 °C in forming gas, the devices {{exhibit}} a field-effect mobility of 18.2 cm²/Vs and a {{negligible hysteresis}}. The improvement is {{attributed to}} a reduction of {{interface trap density}}, as {{confirmed by}} capacitance–voltage measurements. These results {{pave the way for}} low-cost, high-performance flexible electronics.`,
    questions: ['What process step improved the devices?', 'What evidence supports the explanation?'],
  },
  {
    id: 'r-abstract-etch', tier: 2, title: 'Abstract: Low-damage plasma etching', titleVi: 'Tóm tắt bài báo: Khắc plasma ít hư hại',
    text: `Plasma-induced damage remains a {{major challenge}} for scaling GaN devices. Here we {{propose}} a low-power ICP etching process that {{significantly reduces}} sidewall damage while {{maintaining}} an etch rate of 120 nm/min. Compared with the conventional recipe, the new process yields a {{smoother surface}} and a 40% {{lower leakage current}}. We further show that the {{etch selectivity}} can be tuned by adjusting the BCl₃/Cl₂ ratio, {{making it suitable for}} high-frequency transistor fabrication.`,
    questions: ['What is the main problem the paper addresses?', 'How does the new process compare to the conventional one?'],
  },
]
