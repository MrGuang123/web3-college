// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CoursePlatform is Ownable, ReentrancyGuard {
    // Address of the YDToken
    IERC20 public immutable ydToken;

    // Struct to hold course information
    struct Course {
        uint id;
        string title;
        string metadataUrl; // For details like description, cover image, stored on IPFS
        uint price;
        address payable author;
    }

    // --- State Variables ---
    mapping(uint => Course) public courses;
    mapping(uint => mapping(address => bool)) public studentEnrollments; // courseId => studentAddress => isEnrolled
    mapping(address => uint) public authorEarnings; // authorAddress => amount earned
    uint public nextCourseId;

    // --- Events ---
    event CourseCreated(uint indexed courseId, address indexed author, uint price, string title);
    event CoursePurchased(uint indexed courseId, address indexed student, address indexed author, uint price);
    event FundsWithdrawn(address indexed author, uint amount);


    constructor(address _ydTokenAddress) Ownable(msg.sender) {
        require(_ydTokenAddress != address(0), "Invalid token address");
        ydToken = IERC20(_ydTokenAddress);
    }

    /**
     * @dev Creates a new course.
     * @param _title The title of the course.
     * @param _metadataUrl URL to the course's metadata (e.g., on IPFS).
     * @param _price The price of the course in YD tokens.
     */
    function createCourse(string memory _title, string memory _metadataUrl, uint _price) external {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_price > 0, "Price must be greater than zero");

        uint courseId = nextCourseId;
        courses[courseId] = Course({
            id: courseId,
            title: _title,
            metadataUrl: _metadataUrl,
            price: _price,
            author: payable(msg.sender)
        });
        
        nextCourseId++;

        emit CourseCreated(courseId, msg.sender, _price, _title);
    }

    /**
     * @dev Allows a student to buy a course.
     * The student must have approved the contract to spend enough YDToken beforehand.
     * @param _courseId The ID of the course to purchase.
     */
    function buyCourse(uint _courseId) external nonReentrant {
        Course storage course = courses[_courseId];
        require(course.author != address(0), "Course does not exist");
        require(msg.sender != course.author, "Author cannot buy their own course");
        require(!studentEnrollments[_courseId][msg.sender], "Already enrolled");

        uint price = course.price;
        address author = course.author;

        // Transfer YDToken from student to this contract
        bool success = ydToken.transferFrom(msg.sender, address(this), price);
        require(success, "Token transfer failed");

        // Record the student's enrollment
        studentEnrollments[_courseId][msg.sender] = true;

        // Credit the author's earnings
        authorEarnings[author] += price;

        emit CoursePurchased(_courseId, msg.sender, author, price);
    }

    /**
     * @dev Allows an author to withdraw their accumulated earnings.
     */
    function withdrawFunds() external nonReentrant {
        uint amount = authorEarnings[msg.sender];
        require(amount > 0, "No earnings to withdraw");

        // Reset earnings before transfer to prevent re-entrancy attacks
        authorEarnings[msg.sender] = 0;

        // Transfer the YD tokens to the author
        bool success = ydToken.transfer(msg.sender, amount);
        require(success, "Token transfer failed");

        emit FundsWithdrawn(msg.sender, amount);
    }

    /**
     * @dev View function to get all course IDs a student is enrolled in.
     * Note: This can be gas-intensive if a student has many courses. 
     * For dApps, it's often better to index this data off-chain.
     */
    function getEnrolledCourses(address _student) external view returns (uint[] memory) {
        uint count = 0;
        for (uint i = 0; i < nextCourseId; i++) {
            if (studentEnrollments[i][_student]) {
                count++;
            }
        }

        uint[] memory enrolledIds = new uint[](count);
        uint index = 0;
        for (uint i = 0; i < nextCourseId; i++) {
            if (studentEnrollments[i][_student]) {
                enrolledIds[index] = i;
                index++;
            }
        }
        return enrolledIds;
    }

    /**
     * @dev View function to get basic details of all existing courses.
     * Note: Returning dynamic arrays of structs is complex. 
     * It's better to fetch total count and then get details one by one, or index off-chain.
     */
    function getAllCourses() external view returns (Course[] memory) {
        Course[] memory allCourses = new Course[](nextCourseId);
        for (uint i = 0; i < nextCourseId; i++) {
            allCourses[i] = courses[i];
        }
        return allCourses;
    }
}
