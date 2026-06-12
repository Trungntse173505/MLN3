export interface Question {
  id: number;
  statement: string;
  answer: boolean;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const rawQuestions = [
  {
    id: 1,
    statement: "Từ năm 1991, Đảng Cộng sản Việt Nam lấy chủ nghĩa Mác - Lênin và tư tưởng Hồ Chí Minh làm nền tảng tư tưởng.",
    answer: true
  },
  {
    id: 2,
    statement: "Năm 2025 được xác định là năm lịch sử bắt đầu cho kỉ nguyên vươn mình của dân tộc.",
    answer: true
  },
  {
    id: 3,
    statement: "Phát triển đất nước trong kỉ nguyên mới chỉ cần dựa trên hai trụ cột là kinh tế và an sinh xã hội.",
    answer: false,
    explanation: "Cần dựa trên ba trụ cột bền vững là kinh tế, an sinh xã hội và môi trường."
  },
  {
    id: 4,
    statement: "Trong kỉ nguyên mới, Việt Nam không còn phải đối mặt với nguy cơ chiến tranh hay an ninh phi truyền thống.",
    answer: false,
    explanation: "Các yếu tố an ninh phi truyền thống và nguy cơ chiến tranh vẫn tiếp diễn."
  },
  {
    id: 5,
    statement: "Theo tư tưởng Hồ Chí Minh, giáo dục lòng tự hào dân tộc chỉ đơn thuần là việc truyền đạt kiến thức lịch sử một cách khô khan.",
    answer: false,
    explanation: "Không chỉ truyền đạt kiến thức khô khan mà phải khơi dậy tình cảm yêu mến, trân trọng."
  },
  {
    id: 6,
    statement: "Độc lập dân tộc gắn liền với chủ nghĩa xã hội là một trong những nội dung cốt lõi trong tư tưởng Hồ Chí Minh.",
    answer: true
  },
  {
    id: 7,
    statement: "Ý chí tự lực, tự cường theo Hồ Chí Minh là luôn chủ động, sáng tạo, không ỷ lại và không dựa dẫm.",
    answer: true
  },
  {
    id: 8,
    statement: "Bác Hồ chủ trương yêu nước phải gắn liền với việc đóng cửa đất nước, không cần đoàn kết quốc tế.",
    answer: false,
    explanation: "Bác chủ trương kết hợp sức mạnh dân tộc với sức mạnh thời đại, đoàn kết quốc tế sâu rộng."
  },
  {
    id: 9,
    statement: "Giáo dục bằng \"nêu gương\" (người tốt, việc tốt) là một phương pháp quan trọng trong tư tưởng Hồ Chí Minh.",
    answer: true
  },
  {
    id: 10,
    statement: "Theo Bác Hồ, việc giáo dục đạo đức cách mạng chỉ cần thực hiện trong những dịp lễ lớn.",
    answer: false,
    explanation: "Phải được tiến hành một cách có hệ thống, thường xuyên và liên tục."
  },
  {
    id: 11,
    statement: "Bài báo đã sử dụng duy nhất phương pháp nghiên cứu định lượng (khảo sát) để đánh giá thực trạng.",
    answer: false,
    explanation: "Sử dụng phương pháp nghiên cứu hỗn hợp (kết hợp cả định lượng và định tính)."
  },
  {
    id: 12,
    statement: "Bảng hỏi khảo sát trong bài nghiên cứu sử dụng thang đo Likert 5 mức độ.",
    answer: true
  },
  {
    id: 13,
    statement: "Tổng số sinh viên tham gia khảo sát định lượng trong bài báo là đúng 10.000 sinh viên.",
    answer: false,
    explanation: "Số lượng khảo sát là 1265 sinh viên."
  },
  {
    id: 14,
    statement: "Phần mềm được sử dụng để xử lý dữ liệu thống kê trong bài báo là phần mềm SPSS26.",
    answer: true
  },
  {
    id: 15,
    statement: "Có 3 yếu tố chính tác động đến công tác giáo dục chủ nghĩa yêu nước là: Giảng viên, Sinh viên và Gia đình.",
    answer: false,
    explanation: "3 yếu tố chính là Giảng viên, Sinh viên và Nhà trường."
  },
  {
    id: 16,
    statement: "Về phía Giảng viên, \"Trình độ chuyên môn\" và \"Thái độ làm việc, nhiệt huyết\" là hai yếu tố có xếp hạng tác động cao nhất (hạng 1).",
    answer: true
  },
  {
    id: 17,
    statement: "Về phía Sinh viên, \"Năng lực tự học\" được đánh giá là yếu tố có tác động mạnh nhất, xếp hạng 1.",
    answer: false,
    explanation: "Lòng yêu nước, tinh thần cống hiến... mới là yếu tố xếp hạng 1."
  },
  {
    id: 18,
    statement: "\"Chất lượng chương trình, tài liệu giáo dục\" là yếu tố tác động xếp hạng 1 về phía Nhà trường.",
    answer: true
  },
  {
    id: 19,
    statement: "Các môn học như Lý luận chính trị và Giáo dục quốc phòng an ninh không có ưu thế trong việc bồi dưỡng lòng yêu nước.",
    answer: false,
    explanation: "Các môn này có ưu thế lớn và tính lí luận cao trong việc bồi dưỡng lòng yêu nước."
  },
  {
    id: 20,
    statement: "Việc giảng viên sử dụng các nền tảng ứng dụng như Quizizz, Padlet, công nghệ thực tế ảo (VR) góp phần cải thiện đáng kể chất lượng giáo dục.",
    answer: true
  },
  {
    id: 21,
    statement: "Theo thực trạng chỉ ra trong bài báo, một bộ phận người dân và sinh viên còn thờ ơ với các vấn đề chính trị, xã hội.",
    answer: true
  },
  {
    id: 22,
    statement: "Trường Đại học Sư phạm TPHCM định kỳ mỗi 5 năm mới rà soát, chỉnh sửa đề cương chi tiết các học phần một lần.",
    answer: false,
    explanation: "Trường rà soát, chỉnh sửa đề cương định kì hai năm."
  },
  {
    id: 23,
    statement: "Tỉ lệ đoàn kết, tập hợp sinh viên của Trường ĐH Sư phạm TPHCM đạt mức trên 80%.",
    answer: true
  },
  {
    id: 24,
    statement: "Trong giai đoạn 2020 - 2023, Trường ĐH Sư phạm TPHCM đã kết nạp thành công 300 sinh viên vào Đảng Cộng sản Việt Nam.",
    answer: false,
    explanation: "Có 300 sinh viên học lớp nhận thức về Đảng, nhưng chỉ có 124 sinh viên được kết nạp."
  },
  {
    id: 25,
    statement: "Nhóm tác giả đề xuất đúng 5 nhóm giải pháp lớn để nâng cao hiệu quả giáo dục chủ nghĩa yêu nước.",
    answer: false,
    explanation: "Nhóm tác giả đề xuất 3 nhóm giải pháp."
  },
  {
    id: 26,
    statement: "Trong hệ thống giải pháp, việc \"Nhận thức đúng về vai trò, vị trí của công tác giáo dục\" được xem là tiền đề.",
    answer: true
  },
  {
    id: 27,
    statement: "Nội dung giáo dục chủ nghĩa yêu nước cần tách rời khỏi những vấn đề thời sự để đảm bảo giữ nguyên bản sắc cổ truyền.",
    answer: false,
    explanation: "Cần gắn liền với những vấn đề thời sự của đất nước và thế giới."
  },
  {
    id: 28,
    statement: "Giải pháp \"Đổi mới nội dung và phương pháp giáo dục\" được tác giả khẳng định là giải pháp then chốt.",
    answer: true
  },
  {
    id: 29,
    statement: "Trong quá trình phối hợp, gia đình đóng vai trò nền tảng, còn nhà trường giữ vai trò chủ đạo.",
    answer: true
  },
  {
    id: 30,
    statement: "Giảng viên đại học chỉ cần dạy tốt kiến thức chuyên ngành trong giáo trình, không cần tham gia các hoạt động thực tế đời sống.",
    answer: false,
    explanation: "Cần tạo điều kiện để giảng viên tham gia vào các hoạt động thực tế gắn liền với đời sống xã hội để có thêm cảm hứng giáo dục cho sinh viên."
  }
];

export const questions: Question[] = rawQuestions.map((q) => ({
  ...q,
  difficulty: q.id <= 10 ? "easy" : q.id <= 20 ? "medium" : "hard"
}));
