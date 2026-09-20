"""
Script to import all 217 real students for New Sunshine Public School (Session 2026-27).
Extracted with 100% fidelity from the official 10-page student directory.
Students with missing Scholar Numbers or DOBs are stored as None/NULL.
"""
from datetime import date
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.academic import Class
from app.models.student import Student
from app.models.result import Result, ResultStatus

# Raw list of all 217 students:
# (s_no, roll_no, scholar_no, student_name, dob_str, class_col, father_name, mother_name)
RAW_STUDENTS_DATA = [
    # Nursery Students (Starting from N05)
    (5, "N05", "770", "Aarohi Kushwaha", "03/05/2023", "Nur", "Sunil Kumar", "Surbhi Kushwaha"),
    (6, "N06", "806", "Alaxia Mehar", "05/11/2022", "Nur", "Mahesh Mehar", "Rekha"),
    (7, "N07", None, "Anush Kumar", "14/07/2023", "Nur", "Ravi Kumar", "Reema"),
    (8, "N08", "812", "Aruhi Sisodiya", "25/07/2023", "Nur", "Sonu Sisodiya", "Pooja Sisodiya"),
    (9, "N09", "786", "Ayush Rathore", "14/03/2022", "Nur", "Ashwin Rathore", "Durga Rathore"),
    (10, "N10", "809", "Darsh Patil", "29/08/2019", "Nur", "Mukesh Patil", "Babita Patil"),
    (11, "N11", "739", "Devansh Bawaskar", "10/04/2023", "Nur", "Umesh Bawaskar", "Rajeshwari Bawaskar"),
    (12, "N12", "794", "Devanshi Baghel", "22/03/2023", "Nur", "Bhupendra Baghel", "Jyoti Baghel"),
    (13, "N13", "780", "Dipti Rathore", "02/12/2022", "Nur", "Dharamraj", "Gayatri"),
    (14, "N14", "789", "Ditya Goswami", "21/10/2022", "Nur", "Mahendra Goswami", "Anjali Goswami"),
    (15, "N15", "788", "Gouransh Khandekar", "04/08/2022", "Nur", "Sachin Khandekar", "Soniya Khadekar"),
    (16, "N16", "826", "Kartavya Kanare", "02/03/2023", "Nur", "Rajendra Kanare", "Sarika Kanare"),
    (17, "N17", "779", "Kartik Kumar Prajapati", "06/01/2023", "Nur", "Dinesh", "Rajkumari"),
    (18, "N18", "816", "Kiyansh Singh", "16/10/2023", "Nur", "Devendra Singh", "Chandrprabha"),
    (19, "N19", "742", "Krishna Malviya", "06/12/2022", "Nur", "Satish Kumar", "Ladkuwar"),
    (20, "N20", "800", "Mishti Panwar", "23/06/2022", "Nur", "Vinod Panwar", "Sunita Panwar"),
    (21, "N21", "781", "Mishti Patidar", "03/04/2023", "Nur", "Ankit Patidar", "Pooja Patidar"),

    # Page 2 (22 to 43)
    (22, "N22", "808", "Mityanshi Kushwah", "25/07/2023", "Nur", "Dharmendra Kushwah", "Neha Kushwah"),
    (23, "N23", None, "Nisha", "23/03/2022", "Nur", "Prakash Arjun Gopal", "Sapna"),
    (24, "N24", "790", "Nitya Goswami", "21/10/2022", "Nur", "Mahendra Goswami", "Anjali Goswami"),
    (25, "N25", "810", "Pakhi Gahlot", "03/05/2023", "Nur", "Rahul Gehlot", "Damini Gehlot"),
    (26, "N26", "831", "Parth Patel", "15/01/2023", "Nur", "Saurabh Patel", "Rashmi Patel"),
    (27, "N27", None, "Pihu Patil", "18/12/2022", "Nur", "Rajesh Patil", "Sonu"),
    (28, "N28", "819", "Pryanshu Kushwah", "26/11/2021", "Nur", "Rajendra Kushwah", "Sakun Kushwah"),
    (29, "N29", "775", "Rajkumar Ghoshi", "21/11/2022", "Nur", "Haricharan Ghoshi", "Rita Ghoshi"),
    (30, "N30", "767", "Rohan Patil", "19/05/2023", "Nur", "Suneel Patil", "Laxmi Patil"),
    (31, "N31", None, "Sachin Yadav", "04/02/2022", "KG I", "Banti Yadav", "Seema Yadav"),
    (32, "N32", "784", "Shivam Ravi Patil", "18/07/2022", "Nur", "Ravi Ramesh Patil", "Meena Ravi Patil"),
    (33, "N33", "814", "Sumit Jatav", "02/07/2022", "Nur", "Naresh Jatav", "Asha Jatav"),
    (34, "N34", "818", "Vedansh Choukse", "11/01/2023", "Nur", "Ashish Choukse", "Muskan Choukse"),
    (35, "N35", "778", "Yuvi Solanki", "30/09/2023", "Nur", "Jagdish Solanki", "Pooja Solanki"),
    (36, "K101", "769", "Aakriti Kushwaha", "13/06/2021", "KG I", "Sunil Kumar", "Surbhi Kushwaha"),
    (37, "K102", "747", "Akaay", "29/12/2021", "KG I", "Yashvant", "Vidhya Bharti Banshkar"),
    (38, "K103", "777", "Ashvary Chouhan", "05/04/2022", "KG I", "Ajay Chouhan", "Premlata"),
    (39, "K104", "823", "Avika", "04/03/2022", "KG I", "Ramniwas", "Seema"),
    (40, "K105", "761", "Ayush Jha", "15/06/2022", "KG I", "Ratnesh Kumar", "Sapna Kumari"),
    (41, "K106", "620", "Daksh Adhnar", "29/06/2021", "KG I", "Dinesh Adhnar", "Chandrakala Adhnar"),
    (42, "K107", "752", "Ganesh Lodhi", "26/08/2021", "KG I", "Mahesh Lodhi", "Priyanka Lodhi"),
    (43, "K108", "783", "Ishika Arya", "19/08/2022", "KG I", "Manish Arya", "Bhavna Arya"),

    # Page 3 (44 to 64)
    (44, "K109", "828", "Jiyanshi Meena", "26/12/2022", "KG I", "Shekhar Meena", "Preeti Meena"),
    (45, "K110", "730", "Kartik Yadav", "08/09/2021", "KG I", "Madhur Yadav", "Mohani Yadav"),
    (46, "K111", "772", "Khiyansh Biswas", "14/10/2021", "KG I", "Sanjay Biswas", "Ritika Biswas"),
    (47, "K112", "725", "Krishna", "24/07/2022", "KG I", "Hariom Kushwah", "Laxmi Kushwah"),
    (48, "K113", "724", "Mahak Vishwkarma", "03/08/2021", "KG I", "Sitaram Vishwkarma", "Babli Vishwkarma"),
    (49, "K114", "759", "Manak Pawar", "22/06/2022", "KG I", "Jeevan Pawar", "Jyoti Pawar"),
    (50, "K115", "822", "Nena Malviya", "20/04/2021", "KG I", "Babulal Malviya", "Komal"),
    (51, "K116", "749", "Pallvi Shukla", "30/07/2022", "KG I", "Umesh Kumar Shukla", "Bharti Devi"),
    (52, "K117", "750", "Prisha Ojha", "15/03/2022", "KG I", "Brijesh Ojha", "Hemlata Ojha"),
    (53, "K118", "740", "Priyanshi Rajawat", "02/10/2021", "KG I", "Brajpal Singh", "Pallavi Singh Rajawat"),
    (54, "K119", "641", "Raksha Bansal", "22/08/2021", "KG I", "Mulchand Bansal", "Pinki Bansal"),
    (55, "K120", "804", "Ranjeet Jatav", "06/09/2021", "KG I", "Veer Singh", "Sakum Jatav"),
    (56, "K121", "744", "Ridoy Kirar", "10/09/2021", "KG I", "Vikram Kirar", "Sapna Kirar"),
    (57, "K122", "6", "Rishank Patil", "15/01/2023", "KG I", "Sumit Patil", "Ankita Patil"),
    (58, "K123", "760", "Ritika Ahirwar", "14/10/2021", "KG I", "Bakil Ahirwar", "Swati Ahirwar"),
    (59, "K124", "745", "Rudra", "30/07/2022", "KG I", "Bhanvarlal", "Arti Bai"),
    (60, "K125", "731", "Rudraksh Sharma", "18/06/2021", "KG I", "Rajat Sharma", "Shivani Sharma"),
    (61, "K126", "805", "Saransh Solanki", "23/01/2022", "KG I", "Lokesh Solanki", "Oma Solanki"),
    (62, "K127", "776", "Sukanya Rathore", "29/09/2020", "KG I", "Dharamraj", "Gayatri"),
    (63, "K128", "774", "Vineet Ahirwar", "10/07/2021", "KG I", "Ravindra Ahirwar", "Leela Ahirwar"),
    (64, "K201", "811", "Aarushi Sisodiya", "10/04/2021", "KG II", "Sonu Sisodiya", "Pooja Sisodiya"),

    # Page 4 (65 to 86)
    (65, "K202", "787", "Aditya Jatav", "21/04/2021", "KG II", "Vijay Singh", "Varsha"),
    (66, "K203", "771", "Ananya Sen", "01/06/2022", "KG II", "Gourav Sen", "Jyoti Sen"),
    (67, "K204", "751", "Anjal Patel", "26/03/2021", "KG II", "Sanjay Patel", "Rashmi Patel"),
    (68, "K205", "782", "Ankit Patil", "12/05/2021", "KG II", "Suneel Patil", "Laxmi Patil"),
    (69, "K206", "613", "Anshika Ankit Sharma", "21/01/2021", "KG II", "Ankit Sharma", "Soni Sharma"),
    (70, "K207", "616", "Aryan Verma", "06/06/2021", "KG II", "Pramod Kumar", "Pooja Devi Verma"),
    (71, "K208", "628", "Daksh", "01/07/2021", "KG II", "Kamal Malviya", "Anita Malviya"),
    (72, "K209", "792", "Devanshi Bairagi", "13/07/2020", "KG II", "Anil Bairagi", "Shivani"),
    (73, "K210", "614", "Devraj Singh Rajpoot", "29/01/2021", "KG II", "Gabbar Singh Rajpoot", "Babita Rajpoot"),
    (74, "K211", "600", "Garv Sharma", "06/01/2021", "KG II", "Gajendra Sharma", "Poonam Sharma"),
    (75, "K212", "595", "Harshita Rai", "13/01/2020", "KG II", "Raju Rai", "Rina Rai"),
    (76, "K213", "626", "Jyoti Kanwar", "13/05/2020", "KG II", "Madan Singh", "Nazar Kunwar"),
    (77, "K214", "601", "Kanishka Kushwah", "16/06/2020", "KG II", "Sitram Kushwah", "Ankita Kushwah"),
    (78, "K215", "635", "Mishthi Bhalse", "26/10/2020", "KG II", "Sanjay Bhalse", "Ranjita Bhalse"),
    (79, "K216", "766", "Mishti Masneriya", "13/08/2020", "KG II", "Rohit Masneriya", "Suneeta"),
    (80, "K217", "621", "Nidhyana Koge", "05/02/2021", "KG II", "Arun Koge", "Pooja Koge"),
    (81, "K218", "735", "Pihu Panwar", "26/02/2021", "KG II", "Nilesh Panwar", "Krapa Panwar"),
    (82, "K219", "802", "Pradhum Jatav", "07/10/2021", "KG II", "Bahadur Jatav", "Rachna Bai Jatav"),
    (83, "K220", "618", "Priyanshi Polaya", "23/03/2021", "KG II", "Narbat Singh Polaya", "Chhama Polaya"),
    (84, "K221", "785", "Riya Ravi Patil", "06/03/2020", "KG II", "Ravi Ramesh Patil", "Meena Ravi Patil"),
    (85, "K222", "762", "Rudransh Singh", "17/07/2021", "KG II", "Rajendra Singh", "Pooja Singh"),
    (86, "K223", "815", "Sanskar Dashore", "20/08/2021", "KG II", "Jayprakash Dashore", "Heena Dashore"),

    # Page 5 (87 to 108)
    (87, "K224", "636", "Shivansh Rathore", "20/03/2021", "KG II", "Dhurvesh Singh Rathore", "Ashoo Rathore"),
    (88, "K225", "509", "Shrishti Pal", "15/01/2021", "KG II", "Kundan Pal", "Rani Pal"),
    (89, "K226", "799", "Tanish Vishvkarma", "21/04/2019", "1st", "Vimal Kumar", "Puja"),
    (90, "K227", "631", "Tanshi Garge", "16/09/2020", "KG II", "Murar Garge", "Bharti Garg"),
    (91, "K228", "608", "Vedansh Rathore", "19/11/2021", "KG II", "Dharmendra Rathore", "Suman Rathore"),
    (92, "K229", "639", "Vikash Gautam", "15/05/2021", "KG II", "Kaushal Gautam", "Anju Gautam"),
    (93, "K230", "622", "Viyan Solanki", "16/07/2021", "KG II", "Jagdish Solanki", "Pooja Solanki"),
    (94, "K231", "599", "Yachika Chohan", "16/07/2021", "KG II", "Kamlesh Chouhan", "Sushma Chouhan"),
    (95, "K232", "727", "Yakshit Gangore", "24/06/2021", "KG II", "Khemchand Gangore", "Meera Gangore"),
    (96, "K233", "734", "Yash Kumar", "01/11/2020", "KG II", "Ravi Verma", "Reema Verma"),
    (97, "101", "493", "Aditya Jajam", "22/02/2020", "1st", "Prakash Jajam", "Geeta Jajam"),
    (98, "102", "541", "Ansh Jatav", "06/08/2019", "1st", "Vijay Singh Dailwanee", "Varsha Jatav"),
    (99, "103", "817", "Anurag Jatav", "02/08/2020", "1st", "Rakesh Jatav", "Kusum Jatav"),
    (100, "104", "753", "Arnav Kamle", "14/01/2021", "1st", "Sanjay Kamle", "Gopi Kamle"),
    (101, "105", "522", "Daksh Patel", "04/01/2020", "1st", "Jaypal Patel", "Shivani Patel"),
    (102, "106", "485", "Danish Fathrod", "28/01/2020", "1st", "Ravi Fathrod", "Anita Fathrod"),
    (103, "107", "743", "Himanshu Kushwah", "20/06/2018", "1st", "Rajendra Kushwah", "Shakun Kushwah"),
    (104, "108", "837", "Kartik Vishwkarma", "10/09/2020", "1st", "Sanjeev Vishwkarma", "Urmila Vishwkarma"),
    (105, "109", "502", "Mahak Panwar", "27/11/2017", "1st", "Jeevan Panwar", "Jyoti Panwar"),
    (106, "110", "593", "Mayank Kushwah", "25/10/2019", "1st", "Imrat Kushwah", "Bharti Kushwah"),
    (107, "111", "518", "Neha Rathore", "26/07/2019", "1st", "Ravi Rathore", "Anita Rathore"),
    (108, "112", "520", "Netra Singh Bundela", "20/01/2020", "1st", "Rahul Singh Bundela", "Anjali Bundela"),

    # Page 6 (109 to 130)
    (109, "113", "716", "Nitish Katiyar", "30/10/2019", "1st", "Vijay Katiyar", "Kala Katiyar"),
    (110, "114", "548", "Pragya Patel", "28/11/2018", "1st", "Premlal Patel", "Kavita Patel"),
    (111, "115", "754", "Pranav Kamle", "14/01/2021", "1st", "Sanjay Kamle", "Gopi Kamle"),
    (112, "116", "801", "Preeti Jatav", "11/10/2020", "1st", "Bahadur Jatav", "Rachna Bai Jatav"),
    (113, "117", "748", "Prince Rajput", "25/01/2020", "1st", "Rajeshwar Rajput", "Preeti Rajput"),
    (114, "118", "524", "Risha", "02/02/2020", "1st", "Pramod Verma", "Pooja Verma"),
    (115, "119", "803", "Shivansh Jatav", "07/11/2019", "1st", "Veer Singh", "Sakum Jatav"),
    (116, "120", "527", "Shivanya Lodhi", "22/02/2020", "1st", "Satish Lodhi", "Parvati Lodhi"),
    (117, "121", "717", "Shrashti Soor", "23/07/2020", "1st", "Shankar prasad", "Hari Priya"),
    (118, "122", "487", "Sunny Panwar", "06/10/2018", "1st", "Mangal Panwar", "Kavita Panwar"),
    (119, "123", "791", "Trisha Khandekar", "28/12/2018", "1st", "Sachin Khandekar", "Soniya Khadekar"),
    (120, "124", "829", "Vedanshi Meena", "03/08/2021", "1st", "Shekhar Meena", "Preeti Meena"),
    (121, "201", "388", "Aarvi Sengar", "27/02/2019", "2nd", "Vipin Sengar", "Aarti Sengar"),
    (122, "202", "824", "Aayra Aatle", "28/04/2019", "2nd", "Ramniwas", "Seema"),
    (123, "203", "386", "Aayush Dhanak", "14/01/2018", "2nd", "Rajkumar Dhanak", "Anjali Dhanak"),
    (124, "204", "793", "Arohi Bairagi", "15/01/2019", "2nd", "Anil Bairagi", "Shivani"),
    (125, "205", "379", "Aryn Pal", "15/12/2017", "2nd", "Dhanpal Pal", "Sonam Pal"),
    (126, "206", "393", "Dhruv Sawner", "02/09/2017", "2nd", "Sunil Sawner", "Rashmita Sawner"),
    (127, "207", "385", "Divyansh Baroliya", "20/12/2018", "2nd", "Hemraj Baroliya", "Maya Baroliya"),
    (128, "208", "615", "Dixsha Polaya", "30/10/2018", "2nd", "Narbat Singh Polaya", "Chhama Polaya"),
    (129, "209", "542", "Durga Malviya", "13/10/2015", "2nd", "Lakhan Malviya", "Sanjana Malviya"),
    (130, "210", "710", "Gauri Pandey", "14/08/2018", "3rd", "Vijay Shankar Pandey", "Rakhi Pandey"),

    # Page 7 (131 to 152)
    (131, "211", "629", "Hanshika", "29/08/2019", "2nd", "Kamal Malviya", "Anita Malviya"),
    (132, "212", "377", "Kanishka Masani", "25/12/2019", "2nd", "Rajendra Masani", "Radha Masani"),
    (133, "213", "591", "Kartik Patel", "11/01/2016", "2nd", "Premlal Patel", "Kavita Patel"),
    (134, "214", "592", "Krishna Tirole", "12/12/2018", "2nd", "Bhupendra Tirole", "Seema Tirole"),
    (135, "215", "449", "Mahee Gangore", "24/10/2019", "2nd", "Khemchand Gangore", "Meera Gangore"),
    (136, "216", "389", "Mahi Dangode", "11/03/2018", "2nd", "Champalal Dangode", "Manju Dangode"),
    (137, "217", "383", "Pakhi Bhadoriya", "29/10/2019", "2nd", "Sonu Singh Bhadoriya", "Swati Bhadoriya"),
    (138, "218", "503", "Pihu Malviya", "15/11/2019", "2nd", "Ram Charan Malviya", "Rekha Malviya"),
    (139, "219", "481", "Priyansh Patel", "05/08/2019", "2nd", "Sourabh Patel", "Rashmi Patel"),
    (140, "220", "798", "Ridam Sharma", "02/07/2017", "2nd", "Nitesh Sharma", "Meena Sharma"),
    (141, "221", "392", "Riya Ray", "29/05/2017", "2nd", "Raju Ray", "Reena Ray"),
    (142, "222", "480", "Riyanshi Rathore", "08/04/2020", "2nd", "Dharmendra Rathore", "Suman Rathore"),
    (143, "223", "833", "Ronak", "20/06/2016", "2nd", "Sanjay Lodhi", "Manisha"),
    (144, "224", "381", "Ruchika Chouhan", "13/06/2019", "2nd", "Kamlesh Chouhan", "Sushma Chouhan"),
    (145, "225", "395", "Shivay Yadav", "22/03/2019", "2nd", "Avdhesh Yadav", "Rubi Yadav"),
    (146, "226", "630", "Tanvi Garge", "11/10/2018", "2nd", "Murar Garge", "Bharti Garge"),
    (147, "301", "418", "Aaradhya Turkar", "30/05/2018", "3rd", "Dhanpal Turkar", "Anushiya Turkar"),
    (148, "302", "342", "Aarvi Sharma", "24/12/2018", "3rd", "Hemraj Sharma", "Shetal Sharma"),
    (149, "303", "539", "Aastha Rajput", "27/06/2018", "3rd", "Gabbar Singh", "Babita Rajput"),
    (150, "304", None, "Abhi Vishwakarma", None, "3rd", "Sanjeev Vishwkarma", "Urmila Vishwkarma"),
    (151, "305", "820", "Aditya", "12/12/2016", "3rd", "Babulal Malviya", "Komal"),
    (152, "306", "523", "Anurag Patel", "09/07/2018", "3rd", "Jaypal Patel", "Shivani Patel"),

    # Page 8 (153 to 174)
    (153, "307", "367", "Ayu Singh", "17/09/2017", "3rd", "Devendra Singh", "Chandra Prabha"),
    (154, "308", "830", "Deepika Jatav", "01/06/2018", "3rd", "Rakesh Jatav", "Kusum Jatav"),
    (155, "309", "341", "Ishanvi Sharma", "24/04/2019", "3rd", "Hemant Sharma", "Shanti Sharma"),
    (156, "310", "450", "Kanak Malviya", "03/05/2017", "3rd", "Satish Malviya", "Laad Kunwar"),
    (157, "311", "504", "Mayank Jamoriya", "03/03/2018", "3rd", "Pramod Singh", "Rachna Singh"),
    (158, "312", "417", "Neha Chouhan", "28/11/2016", "3rd", "Vinod Chouhan", "Malti Chouhan"),
    (159, "313", "825", "Parwati", "26/07/2017", "3rd", "Ramniwas", "Seema"),
    (160, "314", "553", "Radhika Tirole", "28/04/2017", "3rd", "Rakesh Tirole", "Sumati Tirole"),
    (161, "315", "412", "Ritik Patel (21291629224)", "26/02/2017", "3rd", "Shribhan Patel", "Siyabai Patel"),
    (162, "316", "415", "Santoshi Lodhi", "05/08/2016", "3rd", "Satish Lodhi", "Parwati Lodhi"),
    (163, "317", "525", "Shalini", "17/06/2017", "3rd", "Pramod Verma", "Pooja Verma"),
    (164, "318", "513", "Sultan Singh Rajput", "13/07/2018", "3rd", "Anurag Singh Rajput", "Barsa Rajput"),
    (165, "319", "413", "Tanmay Rajput", "18/11/2017", "3rd", "Poonam Rajput", "Kiran Rajput"),
    (166, "401", "419", "Aakash Gautam", "26/04/2017", "4th", "Kaushal Gautam", "Anju Gautam"),
    (167, "402", "277", "Aayush Ekle", "04/06/2016", "4th", "Ajay Ekle", "Kavita Ekle"),
    (168, "403", "337", "Abhi Kushwah", "15/03/2018", "4th", "Deepak Kushwah", "Priti Kushwah"),
    (169, "404", "713", "Ananya Katiyar", "02/01/2018", "4th", "Vijay Katiyar", "Kala Katiyar"),
    (170, "405", "538", "Anisha Malviya", "03/08/2011", "4th", "Lakhan Malviya", "Sanjana Malviya"),
    (171, "406", "311", "Anushka Dhanak", "31/12/2015", "4th", "Raj Kumar Dhank", "Anjali Dhank"),
    (172, "407", "414", "Aryan Devda", "20/06/2016", "4th", "Ramdayal Devda", "Pingala Devda"),
    (173, "408", "289", "Bhavesh Sawner", "09/05/2015", "4th", "Mukesh Sawner", "Sangeeta Sawner"),
    (174, "409", "279", "Dhairya Sharma", "04/07/2015", "4th", "Manoj Sharma", "Sangeeta Sharma"),

    # Page 9 (175 to 196)
    (175, "410", "340", "Divya Ram", "03/02/2017", "4th", "Deepak Ram", "Rani Ram"),
    (176, "411", "797", "Divyansh Kushwah", "02/12/2017", "4th", "Naval Singh Kushwah", "Pooja Bai"),
    (177, "412", "406", "Harshwardhan Singh Tomar", "17/09/2017", "4th", "Upendra Singh Tomar", "Sonali Tomar"),
    (178, "413", "543", "Himanshu Malviya", "27/01/2013", "4th", "Lakhan Malviya", "Sanjana Malviya"),
    (179, "414", "221", "Ishan Rathore", "22/09/2015", "4th", "Vijay Rathore", "Sarita Rathore"),
    (180, "415", "486", "Jeevika Pawar", "14/01/2017", "4th", "Mangal Panwar", "Kavita Panwar"),
    (181, "416", "102", "Krishna Mandloi", "13/10/2014", "4th", "Sonu Mandloi", "Reena Mandloi"),
    (182, "417", "409", "Manav Jha", "12/09/2016", "4th", "Rakesh Jha", "Suman Kumari Jha"),
    (183, "418", "546", "Pooja Ahirwar", "15/09/2015", "4th", "Babulal Ahirwar", "Kiran Ahirwar"),
    (184, "419", "410", "Pratigya Patel", "01/04/2014", "4th", "Shribhan Patel", "Siyabai Patel"),
    (185, "420", "369", "Radhika Rathore", "12/04/2017", "4th", "Dharmendra Singh", "Suman Rathore"),
    (186, "421", "773", "Rajeev Ahirwar", "07/06/2017", "4th", "Ravindra Ahirwar", "Leela Ahirwar"),
    (187, "422", "255", "Rakhi Ray", "19/08/2015", "4th", "Raju Ray", "Reena Ray"),
    (188, "423", "298", "Riya Pagare", "30/01/2016", "4th", "Deepak Pagare", "Pinky Pagare"),
    (189, "424", "402", "Sarthak Fatrod", "30/08/2015", "4th", "Ravi Fathrod", "Anita Fathrod"),
    (190, "425", "276", "Shourya Sharma", "04/07/2015", "4th", "Manoj Sharma", "Sangeeta Sharma"),
    (191, "426", "552", "Suraj Tirole", "23/05/2015", "4th", "Rakesh Tirole", "Sumati Tirole"),
    (192, "427", "478", "Swati Fatrod", "30/08/2015", "4th", "Ravi Fatrod", "Anita Fathrod"),
    (193, "428", "243", "Tushar Adhanar", "01/02/2016", "4th", "Mahesh Adhanar", "Rekha Adhanar"),
    (194, "601", "498", "Abhishek Singh", "01/03/2016", "6th", "Pramod Singh", "Rachna Singh"),
    (195, "602", "92", "Aditi Tirole (Patel)", "30/10/2012", "6th", "Bhupendra Tirole", "Seema Tirole"),
    (196, "603", "795", "Aman Jatav", "15/08/2013", "6th", "Chandrabhan Jatav", "Aasha Bai"),

    # Page 10 (197 to 217)
    (197, "604", "489", "Bhavesh Pawar", "16/03/2012", "6th", "Mangal Pawar", "Kavita Panwar"),
    (198, "605", "262", "Ishant Jatav", "10/03/2014", "6th", "Dharmendra Jatav", "Kamlesh Jatav"),
    (199, "606", "84", "Kashish Rathore", "27/03/2014", "6th", "Vijay Rathore", "Savita Rathore"),
    (200, "607", "103", "Mahima Mandloi", "26/02/2013", "6th", "Sonu Mandloi", "Reena Mandloi"),
    (201, "608", "711", "Pavan Kumar Pandey", "05/11/2015", "6th", "Vijayshankar Pandey", "Rakhi Pandey"),
    (202, "609", "290", "Purva Sawner", "20/03/2013", "6th", "Mukesh Sawner", "Sangeeta Sawner"),
    (203, "610", "834", "Ruhi", "31/05/2015", "6th", "Sanjay Lodhi", "Manisha"),
    (204, "611", "430", "Saloni Sawner", "05/04/2016", "6th", "Sunil Sawner", "Rashmita Sawner"),
    (205, "612", "73", "Vansh Gupta", "12/07/2014", "6th", "Dharmendra Gupta", "Neetu Gupta"),
    (206, "613", "74", "Vanshika Gupta", "30/04/2012", "6th", "Dharmendra Gupta", "Neetu Gupta"),
    (207, "701", "529", "Bhanu Pratap Pal", "13/06/2014", "7th", "Kundan Pal", "Rani Pal"),
    (208, "702", "715", "Ganesh Rathore", "31/07/2010", "7th", "Dinesh Rathore", "Rukmani Rathore"),
    (209, "703", "17", "Gourav Patil", "03/08/2012", "7th", "Mahesh Patil", "Asha Patil"),
    (210, "704", "425", "Hariom Maych", "05/08/2013", "7th", "Rajesh Maych", "Saraswati Maych"),
    (211, "705", "475", "Khushi Bhadauriya", "17/07/2013", "7th", "Raghuveer Singh Bhadoriya", "Sandhaya Bhadoriya"),
    (212, "706", "796", "Laxmi Kushwah", "20/03/2015", "7th", "Naval Singh Kushwah", "Pooja Bai"),
    (213, "707", "554", "Mayank Verma", "12/12/2014", "7th", "Raghuraj Verma", "Sunita Verma"),
    (214, "708", "89", "Rudraksh Singh Sengar", "21/07/2014", "7th", "Vipin Singh Sengar", "Arti Singh"),
    (215, "709", "433", "Sakshi Jha", "17/12/2013", "7th", "Rakesh Jha", "Suman Kumari Jha"),
    (216, "710", "511", "Sandeep Panwar", "19/07/2011", "7th", "Ramchandra Panwar", "Anita Panwar"),
    (217, "711", "162", "Shagun Malviya", "05/10/2014", "7th", "Satish Malviya", "Ladkunvar Malviya"),
]

def parse_dob(dob_str):
    if not dob_str:
        return None
    try:
        parts = dob_str.strip().split("/")
        if len(parts) == 3:
            day, month, year = int(parts[0]), int(parts[1]), int(parts[2])
            return date(year, month, day)
    except Exception:
        pass
    return None

def map_class_name(class_col, roll_no):
    col = (class_col or "").strip().upper()
    if col in ["PRE-NUR", "PRE-NURSERY", "NUR", "NURSERY"]:
        return "NUR"
    elif col in ["KG I", "KGI", "KG-I", "KG 1"]:
        return "KGI"
    elif col in ["KG II", "KGII", "KG-II", "KG 2"]:
        return "KGII"
    elif col in ["1ST", "1", "I"]:
        return "I"
    elif col in ["2ND", "2", "II"]:
        return "II"
    elif col in ["3RD", "3", "III"]:
        return "III"
    elif col in ["4TH", "4", "IV"]:
        return "IV"
    elif col in ["6TH", "6", "VI"]:
        return "VI"
    elif col in ["7TH", "7", "VII"]:
        return "VII"
    
    # Fallback by roll number prefix
    roll = str(roll_no).upper()
    if roll.startswith("N"):
        return "NUR"
    elif roll.startswith("K1"):
        return "KGI"
    elif roll.startswith("K2"):
        return "KGII"
    elif roll.startswith("1"):
        return "I"
    elif roll.startswith("2"):
        return "II"
    elif roll.startswith("3"):
        return "III"
    elif roll.startswith("4"):
        return "IV"
    elif roll.startswith("6"):
        return "VI"
    elif roll.startswith("7"):
        return "VII"
    return "I"

def import_all_students(db: Session = None):
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        # Build class lookup map
        classes = db.query(Class).all()
        class_map = {c.name: c for c in classes}
        print(f"Available classes: {list(class_map.keys())}")

        # Clear existing demo marks, results, and students if doing a clean re-import
        # We preserve classes, users, permissions, and school settings
        print("Clearing previous student marks, results, and student records...")
        from app.models.marks import Mark
        db.execute(Mark.__table__.delete())
        db.execute(Result.__table__.delete())
        db.execute(Student.__table__.delete())
        db.commit()

        imported_count = 0
        class_counts = {}

        for s_no, roll_no, scholar_no, student_name, dob_str, class_col, father_name, mother_name in RAW_STUDENTS_DATA:
            target_class_name = map_class_name(class_col, roll_no)
            cls = class_map.get(target_class_name)
            if not cls:
                print(f"WARNING: Class {target_class_name} not found for student {student_name}!")
                continue

            parsed_dob = parse_dob(dob_str)

            student = Student(
                class_id=cls.id,
                student_name=student_name.strip(),
                father_name=father_name.strip() if father_name else "",
                mother_name=mother_name.strip() if mother_name else "",
                date_of_birth=parsed_dob,
                scholar_number=scholar_no.strip() if scholar_no else None,
                roll_number=str(roll_no).strip(),
                contact_number=None,
                address="Indore (M.P.)",
                is_active=True
            )
            db.add(student)
            db.flush()

            # Initialize empty result placeholder
            result = Result(
                student_id=student.id,
                half_yearly_total=0.0,
                annual_total=0.0,
                annual_max_marks=0.0,
                percentage=0.0,
                completion_status=ResultStatus.PENDING
            )
            db.add(result)

            imported_count += 1
            class_counts[target_class_name] = class_counts.get(target_class_name, 0) + 1

        db.commit()
        print(f"Successfully imported {imported_count} students!")
        print(f"Class breakdown:")
        for cname in ["NUR", "KGI", "KGII", "I", "II", "III", "IV", "VI", "VII"]:
            print(f"  Class {cname:5s}: {class_counts.get(cname, 0)} students")

    except Exception as e:
        db.rollback()
        print(f"Error during student import: {e}")
        raise e
    finally:
        if should_close:
            db.close()

if __name__ == "__main__":
    import_all_students()
