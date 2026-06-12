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
    statement: "Quá trình hiện đại hóa quốc gia đồng nghĩa với việc xóa bỏ hoàn toàn các yếu tố truyền thống để xác lập các hệ giá trị mới.",
    answer: false,
    explanation: "Hiện đại hóa là quá trình vượt thoát các yếu tố lạc hậu, kết hợp tổng hợp tác động của yếu tố truyền thống và hiện đại."
  },
  {
    id: 2,
    statement: "Mục tiêu ưu tiên hàng đầu của Việt Nam đến năm 2030 là trở thành nước phát triển, có thu nhập cao.",
    answer: false,
    explanation: "Đến năm 2030, mục tiêu là trở thành nước đang phát triển, có công nghiệp hiện đại, thu nhập trung bình cao; năm 2045 mới là nước phát triển, thu nhập cao."
  },
  {
    id: 3,
    statement: "Đời sống tinh thần truyền thống của Việt Nam được phân chia thành dòng quan phương và dòng dân gian, hai dòng này phát triển hoàn toàn biệt lập.",
    answer: false,
    explanation: "Hai dòng này có quan hệ, tác động qua lại, ảnh hưởng lẫn nhau trong sự hình thành hệ giá trị truyền thống."
  },
  {
    id: 4,
    statement: "Việc dự đoán đúng xu hướng hình thành giá trị quốc gia mang tính quyết định tới việc Việt Nam có gia nhập được hàng ngũ các quốc gia tiên tiến hay không.",
    answer: true,
    explanation: "Đây là nhân tố quan trọng bảo đảm thực hiện thắng lợi các mục tiêu phát triển và lợi ích quốc gia - dân tộc."
  },
  {
    id: 5,
    statement: "Văn học nghệ thuật dân gian chỉ có chức năng giải trí, không đóng vai trò gì trong việc củng cố tư tưởng làng xã.",
    answer: false,
    explanation: "Đây là những hình thức truyền tải, phổ biến, củng cố các giá trị tư tưởng làng xã vô cùng hữu hiệu."
  },
  {
    id: 6,
    statement: "Trong chủ trương công nghiệp hóa văn hóa, các giá trị văn học nghệ thuật truyền thống cần được loại bỏ để tập trung hoàn toàn vào yếu tố hiện đại.",
    answer: false,
    explanation: "Các giá trị này đóng vai trò quan trọng, góp phần gìn giữ bản sắc và sản sinh thêm nhiều giá trị mới."
  },
  {
    id: 7,
    statement: "Việc giữ gìn bản sắc văn hóa dân tộc được Đảng và Nhà nước coi là nền tảng tinh thần và sức mạnh nội sinh của sự phát triển.",
    answer: true,
    explanation: "Quan điểm này được khẳng định rõ trong định hướng phát triển văn hóa."
  },
  {
    id: 8,
    statement: "Quá trình phát triển văn hóa nghệ thuật hiện nay chủ trương từ chối tiếp thu các giá trị thế giới để giữ gìn bản sắc thuần túy.",
    answer: false,
    explanation: "Đi theo hướng vừa bảo tồn phát huy bản sắc, vừa tiếp thu các giá trị văn hóa mới của thế giới."
  },
  {
    id: 9,
    statement: "Trong ba luồng tư tưởng Nho - Phật - Lão, Phật giáo giữ vai trò ý thức hệ độc tôn về mặt chính trị - xã hội ở Việt Nam thời phong kiến.",
    answer: false,
    explanation: "Nho giáo mới là hệ tư tưởng chính trị - xã hội chủ đạo, giữ vai trò ý thức hệ độc tôn."
  },
  {
    id: 10,
    statement: "Nền văn hóa Việt Nam đầu thế kỷ XX đã khước từ hoàn toàn các giá trị dân chủ, tự do, công bằng của văn minh phương Tây.",
    answer: false,
    explanation: "Bằng tinh thần dung hòa, nền văn hóa Việt Nam đã thâu nhận thêm nhiều giá trị văn hóa phương Tây."
  },
  {
    id: 11,
    statement: "Tư tưởng xã hội chủ nghĩa cổ vũ đổi mới tư duy, sáng tạo nhưng từ chối điều chỉnh các giá trị mới phù hợp với thực tại Việt Nam.",
    answer: false,
    explanation: "Tư tưởng này thúc đẩy tiếp thu và điều chỉnh các giá trị mới thích hợp với thực tại Việt Nam."
  },
  {
    id: 12,
    statement: "Tư tưởng trọng danh và địa vị xã hội của Nho giáo hiện nay đóng vai trò thúc đẩy mạnh mẽ sự phát triển của tư duy độc lập và dân chủ.",
    answer: false,
    explanation: "Những tư tưởng này khiến tâm lý tôn sùng quyền lực in đậm, gây cản trở to lớn tới tư duy độc lập, dân chủ, sáng tạo."
  },
  {
    id: 13,
    statement: "Bài viết khẳng định các yếu tố truyền thống chỉ tác động lên hệ giá trị dân gian mà không ảnh hưởng gì tới các chính sách quan phương của quốc gia.",
    answer: false,
    explanation: "Tác động của chúng hiện diện trên cả tầng bậc cấu trúc quan phương và dân gian."
  },
  {
    id: 14,
    statement: "Hệ tư tưởng xã hội chủ nghĩa đề cao phát triển kinh tế tư nhân tự do vô nguyên tắc để tối đa hóa lợi ích cá nhân.",
    answer: false,
    explanation: "Hệ tư tưởng này đề cao công bằng xã hội, bình đẳng giai cấp, sở hữu công cộng và phát triển bền vững."
  },
  {
    id: 15,
    statement: "Các giá trị như tự do, dân chủ, công bằng, thượng tôn pháp luật là những hệ giá trị được tiếp thu hoàn toàn từ thời kỳ phong kiến tự chủ.",
    answer: false,
    explanation: "Đây là các giá trị tư tưởng tiếp thu từ Tây phương trong thế kỷ XX và từ hệ tư tưởng xã hội chủ nghĩa."
  },
  {
    id: 16,
    statement: "Việc xây dựng hệ giá trị văn hóa không liên quan đến chiến lược phát triển cân bằng với các mục tiêu kinh tế.",
    answer: false,
    explanation: "Chỉ có thể giải quyết xung đột bằng chiến lược phát triển cân bằng giữa các mục tiêu kinh tế và các giá trị văn hóa."
  },
  {
    id: 17,
    statement: "Một trong những mục đích của việc nghiên cứu tác động của yếu tố truyền thống là để khai thác và phục vụ việc xây dựng hệ giá trị mới của Việt Nam.",
    answer: true,
    explanation: "Điều này giúp nắm bắt quy luật, đề xuất chính sách phù hợp để khai thác, phát huy hiệu quả các yếu tố truyền thống."
  },
  {
    id: 18,
    statement: "Việc xây dựng hệ giá trị quốc gia là một quá trình độc lập, không phụ thuộc vào các mục tiêu phát triển kinh tế - xã hội của đất nước.",
    answer: false,
    explanation: "Quá trình này phụ thuộc vào các mục tiêu phát triển quốc gia đặt ra và thực tiễn đạt tới mục tiêu đó."
  },
  {
    id: 19,
    statement: "Sự hình thành các giá trị mới ở Việt Nam là một quá trình phức tạp, trong đó giá trị truyền thống có thể dung hòa hoặc xung đột với các giá trị mới.",
    answer: true,
    explanation: "Tác giả nhấn mạnh tính phức tạp, đa chiều của quá trình này, bao gồm cả chiều cạnh dung hòa, xung đột, kế thừa và biến đổi."
  },
  {
    id: 20,
    statement: "Hệ giá trị và chuẩn mực thực chất chính là phương diện tinh thần của mục tiêu phát triển quốc gia.",
    answer: true,
    explanation: "Xây dựng hệ giá trị thực chất là xây dựng phương diện tinh thần mà quá trình hiện đại hóa đặt mục tiêu đạt tới vào năm 2045."
  },
  {
    id: 21,
    statement: "Trong bối cảnh hội nhập, hiện tượng lệch chuẩn văn hóa và sự xung đột giá trị giữa các thế hệ là một thực tế tất yếu khách quan.",
    answer: true,
    explanation: "Tác giả khẳng định điều này là tất yếu do giá trị cũ chưa mất đi hẳn, giá trị mới chưa hoàn toàn được xác lập."
  },
  {
    id: 22,
    statement: "Hệ thống lý luận về \"quốc gia - dân tộc\" của Việt Nam trong thời kỳ quá độ lên chủ nghĩa xã hội hiện nay đã được nghiên cứu đầy đủ và hoàn thiện.",
    answer: false,
    explanation: "Đang thiếu những nghiên cứu về quốc gia - dân tộc trong kỷ nguyên mới do tác động của toàn cầu hóa, đây là một khoảng trống đầy thách thức."
  },
  {
    id: 23,
    statement: "Hương ước của làng xã truyền thống chỉ là những quy định ngầm, truyền miệng mà không bao giờ được văn bản hóa.",
    answer: false,
    explanation: "Tư tưởng làng xã được bộc lộ chính thức và điển hình nhất bằng văn bản qua hương ước."
  },
  {
    id: 24,
    statement: "Cốt lõi của đời sống tinh thần dân gian bao gồm tư tưởng làng xã, văn học nghệ thuật dân gian và triết lý dân gian.",
    answer: true,
    explanation: "Các yếu tố này phản ánh tầng sâu văn hóa làng xã, chi phối hoạt động cộng đồng cư dân nông nghiệp."
  },
  {
    id: 25,
    statement: "Trong thời kỳ phong kiến, một người dân làm quan chỉ cần tuân thủ ý thức hệ quan phương, không cần quan tâm đến hệ tư tưởng làng xã ngay cả khi đã về hưu.",
    answer: false,
    explanation: "Khi không làm quan, họ thường trở về làng và tiếp tục tuân thủ hệ tư tưởng làng xã theo nguyên tắc \"sống ở làng, sang ở nước\"."
  },
  {
    id: 26,
    statement: "Quá trình đô thị hóa và giải thể cấu trúc làng xã hiện nay đã làm biến mất hoàn toàn tư tưởng vị lợi, cục bộ địa phương.",
    answer: false,
    explanation: "Những tư tưởng này vẫn tiếp tục tồn tại và có xu hướng cản trở sự hình thành những giá trị mới (thượng tôn pháp luật, bảo vệ môi trường...)."
  },
  {
    id: 27,
    statement: "Hệ thống quản lý xã hội hiện đại từ trung ương đến cấp xã đã củng cố mạnh mẽ các giá trị tự quản và trọng kinh nghiệm truyền thống của làng xã.",
    answer: false,
    explanation: "Quá trình hiện đại hóa đã phá vỡ, làm biến đổi các giá trị này của tư tưởng làng xã."
  },
  {
    id: 28,
    statement: "Tác giả dự báo các tư tưởng làng xã, dù đã biến đổi, vẫn sẽ tiếp tục tồn tại và ảnh hưởng lâu dài tới giá trị quan trong tương lai.",
    answer: true,
    explanation: "Do sự tồn tại hàng nghìn năm và tính chất độc lập tương đối so với tồn tại xã hội của ý thức làng xã."
  },
  {
    id: 29,
    statement: "Tinh thần \"Tam giáo đồng nguyên\" đã làm cho văn hóa tâm linh của người Việt trở nên khép kín và mang tính cực đoan.",
    answer: false,
    explanation: "Tinh thần này tạo nên sự hòa nhập, khoan dung, một truyền thống văn hóa tâm linh phong phú, đa dạng và cởi mở."
  },
  {
    id: 30,
    statement: "Hệ tư tưởng xã hội chủ nghĩa Mác - Lênin có tác động mạnh mẽ đến định hướng chính sách, hình thành các giá trị như bình đẳng giới và bảo vệ môi trường.",
    answer: true,
    explanation: "Hệ tư tưởng này định hướng các chính sách phát triển xã hội hướng tới công bằng, bình đẳng và phát triển bền vững."
  },
  {
    id: 31,
    statement: "Đời sống tinh thần quan phương truyền thống (tư tưởng, văn chương, triết lý sống) tồn tại như những lĩnh vực phân mảnh, không liên quan đến nhau.",
    answer: false,
    explanation: "Trong truyền thống, những yếu tố này là bất phân, làm thành một chỉnh thể văn hóa tinh thần."
  },
  {
    id: 32,
    statement: "Quá trình hình thành hệ giá trị hiện đại đòi hỏi Nhà nước và hệ tư tưởng xã hội chủ nghĩa phải cải cách mạnh mẽ về tư duy quản lý.",
    answer: true,
    explanation: "Cần tạo hệ thống linh động, minh bạch, tạo điều kiện cho cộng đồng chủ động tham gia sáng tạo giá trị."
  },
  {
    id: 33,
    statement: "Tư tưởng duy tình của làng xã luôn đóng vai trò nền tảng vững chắc để xây dựng tinh thần thượng tôn pháp luật trong xã hội ngày nay.",
    answer: false,
    explanation: "Tư tưởng duy tình có xu hướng cản trở sự hình thành các giá trị hiện đại như tinh thần thượng tôn pháp luật."
  },
  {
    id: 34,
    statement: "Việc xác định vị thế hiện tại của quốc gia là điều kiện tiên quyết để xác lập các mục tiêu phát triển quốc gia một cách khoa học.",
    answer: true,
    explanation: "Nhất thiết phải xác định rõ vị thế để đặt ra mục tiêu xây dựng hệ giá trị quốc gia, văn hóa và con người phù hợp."
  },
  {
    id: 35,
    statement: "Các giá trị văn hóa nghệ thuật hiện đại có thể được hình thành bằng cách sử dụng các loại hình nghệ thuật dân tộc để biểu đạt các nội dung mới.",
    answer: true,
    explanation: "Đây là một trong những hướng tác động của văn hóa truyền thống tới sáng tạo nghệ thuật hiện đại."
  },
  {
    id: 36,
    statement: "Nhận thức xu hướng hình thành giá trị quốc gia đòi hỏi sự đánh giá tổng hợp, đạt tầm lý luận và phải mang tính dự báo tương lai.",
    answer: true,
    explanation: "Đánh giá này không được vượt thoát thực tiễn, cần tổng hợp khoa học và mang tính dự báo."
  },
  {
    id: 37,
    statement: "Chủ nghĩa cá nhân vị kỷ và sự thiếu minh bạch thông tin không ảnh hưởng gì đến quá trình tương tác giữa tư tưởng xã hội chủ nghĩa và giá trị truyền thống.",
    answer: false,
    explanation: "Chúng là những yếu tố gây cản trở không nhỏ cho quá trình hình thành các giá trị đáp ứng yêu cầu hiện đại."
  },
  {
    id: 38,
    statement: "Tầng lớp nho sĩ, trí thức tinh hoa của làng xã là lực lượng chủ yếu truyền bá tư tưởng quan phương vào hệ tư tưởng dân gian.",
    answer: true,
    explanation: "Họ tác động thông qua dạy học, sáng tác, soạn thảo hương ước cho phù hợp với chuẩn mực triều đình."
  },
  {
    id: 39,
    statement: "Tư tưởng coi trọng phụ nữ và quyền của phụ nữ trong thừa kế tài sản là một chuẩn mực do Nho giáo quan phương áp đặt xuống làng xã.",
    answer: false,
    explanation: "Đây là tư tưởng làng xã tác động ngược lại tới tư tưởng quan phương, được luật hóa trong Bộ luật Hồng Đức."
  },
  {
    id: 40,
    statement: "Tư tưởng Nho giáo truyền thống đề cao đường lối kinh tế trọng nông ức thương và đạo đức trọng nghĩa hơn lợi.",
    answer: true,
    explanation: "Đây là những đường lối cơ bản tạo lập nên hệ giá trị tinh thần chính thống."
  },
  {
    id: 41,
    statement: "Nho giáo được sử dụng chủ yếu để \"trị thế\", Phật giáo để \"trị tâm\", còn Lão giáo để \"trị thân\".",
    answer: true,
    explanation: "Đây là tinh thần phổ biến trong đời sống tư tưởng của tầng lớp trí thức phong kiến."
  },
  {
    id: 42,
    statement: "Sự đổi mới, sáng tạo trong xã hội hiện đại hiện nay vẫn còn chịu ảnh hưởng và phụ thuộc nhiều vào ý chí của nhà lãnh đạo.",
    answer: true,
    explanation: "Tâm lý tôn sùng quyền lực do ảnh hưởng của Nho giáo vẫn còn tồn tại, làm kìm hãm sự đổi mới trong lĩnh vực chính trị."
  },
  {
    id: 43,
    statement: "Chủ nghĩa tập thể xã hội chủ nghĩa ở giai đoạn trước Đổi mới đã gặp khó khăn và xung đột gay gắt với tinh thần cộng đồng làng xã.",
    answer: false,
    explanation: "Trước đổi mới, chủ nghĩa tập thể đã hòa nhập nhanh chóng với tinh thần cộng đồng làng xã, tạo sự đoàn kết."
  },
  {
    id: 44,
    statement: "Trong nền kinh tế thị trường hiện nay, chủ nghĩa tập thể cứng nhắc được cho là có thể cản trở sự phát triển tinh thần sáng tạo và giá trị cá nhân.",
    answer: true,
    explanation: "Chủ nghĩa tập thể cứng nhắc đã bộc lộ bất cập, cản trở sự đa dạng trong đời sống tinh thần."
  },
  {
    id: 45,
    statement: "Tư tưởng lòng trung thành và hiếu thuận (Nho giáo), nếu không được nâng tầm, có thể dẫn tới sự bảo thủ, chậm tiếp thu quyền tự do cá nhân.",
    answer: true,
    explanation: "Tác giả chỉ ra tính hai mặt của các giá trị đạo đức truyền thống nếu không được đặt vào phạm vi giá trị hiện đại."
  },
  {
    id: 46,
    statement: "Triết lý Phật giáo về vô ngã, luân hồi, nghiệp báo chỉ có mặt tích cực là tạo nền tảng cho sự từ bi, hỉ xả mà không có bất kỳ hạn chế nào.",
    answer: false,
    explanation: "Triết lý này cũng có thể làm suy giảm động lực sáng tạo, gây tâm lý bi quan trong việc xây dựng giá trị hiện đại."
  },
  {
    id: 47,
    statement: "Tư tưởng \"vô vi nhi trị\" của Lão - Trang có giá trị tích cực trong việc điều hòa mối quan hệ tự nhiên - con người, bảo vệ thiên nhiên.",
    answer: true,
    explanation: "Tuy nhiên mặt trái của nó có thể làm mất động lực cải cách hay thực hiện trách nhiệm cộng đồng."
  },
  {
    id: 48,
    statement: "Tính tích cực hay tiêu cực của một tư tưởng truyền thống phụ thuộc hoàn toàn vào tính chất cố hữu của nó, không liên quan đến bối cảnh khách quan.",
    answer: false,
    explanation: "Nó phụ thuộc hoàn toàn vào việc chủ thể nhận thức và hành động có phù hợp với bối cảnh khách quan hay không."
  },
  {
    id: 49,
    statement: "Tác giả cho rằng mọi sự xung đột giá trị giữa các vùng miền trong giai đoạn hội nhập hiện nay đều xuất phát từ hệ tư tưởng tư bản chủ nghĩa.",
    answer: false,
    explanation: "Xung đột là do sự đan xen giữa giá trị cũ chưa mất đi và giá trị mới chưa được xác lập hoàn toàn trong bối cảnh hội nhập."
  },
  {
    id: 50,
    statement: "Theo bài báo, quá trình hình thành các giá trị mới ở Việt Nam đang diễn ra một cách tuyến tính và hoàn toàn có thể dự đoán chính xác tuyệt đối bằng mô hình toán học.",
    answer: false,
    explanation: "Sự hình thành này là một quá trình phức tạp, đa diện, nhiều chiều và không dễ phân định về tính chất."
  }
];

export const questions: Question[] = rawQuestions.map((q) => ({
  ...q,
  difficulty: q.id <= 17 ? "easy" : q.id <= 37 ? "medium" : "hard"
}));
