// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// IERC20.sol: 这是一个接口（Interface）。它只定义了 ERC20 代币有哪些标准的函数
// （如 transfer, transferFrom, balanceOf 等），但没有实现它们。
// 这使得我们的平台合约可以在不知道 YDToken 具体代码的情况下，
// 与任何标准的 ERC20 代币合约进行交互。这是一种很好的解耦实践。
// Ownable.sol: 同样用于所有权管理，确保只有平台所有者（部署合约的人）才能执行某些管理操作。
// ReentrancyGuard.sol: 这是一个非常重要的安全工具，用于防止“重入攻击”（Re-entrancy Attack）

contract CoursePlatform is Ownable, ReentrancyGuard {
    // IERC20: 变量类型是 ERC20 接口。
    // public: 自动创建一个 getter 函数，让任何人都可以查询这个 ydToken 的地址。
    // immutable: 表示这个变量不能被修改，且只能在构造函数中设置一次。
    // 这样做比普通变量更节省 Gas（交易费用），也更安全。
    IERC20 public immutable ydToken;

    // 课程信息结构体
    struct Course {
        uint id;
        string title;
        // metadataUrl 通常会指向一个 IPFS (星际文件系统) 上的 JSON 文件，里面包含课程的详细描述、封面图片等大体积数据，这样可以避免将大量数据存储在区块链上，从而节省成本。
        string metadataUrl;
        uint price;
        address payable author;
    }

    // --- State Variables ---
    // 存储所有课程信息，通过课程 ID (uint) 查找到对应的 Course 结构体。
    mapping(uint => Course) public courses;
    // 一个嵌套映射，用于跟踪学生注册情况。第一个 key 是课程 ID，第二个 key 是学生地址，值为 true 表示该学生已注册该课程。
    mapping(uint => mapping(address => bool)) public studentEnrollments;
    // 记录每个作者赚取了多少 YDToken 并等待提取。
    mapping(address => uint) public authorEarnings;
    // 用于生成自增的课程 ID。
    uint public nextCourseId;

    // --- Events ---
    // 创建课程触发事件
    event CourseCreated(uint indexed courseId, address indexed author, uint price, string title);
    // 购买课程触发事件
    event CoursePurchased(uint indexed courseId, address indexed student, address indexed author, uint price);
    // 提取资金触发事件
    event FundsWithdrawn(address indexed author, uint amount);

    // 构造函数需要提供YDToken合约地址，，将部署者设置为合约所有者
    constructor(address _ydTokenAddress) Ownable(msg.sender) {
        require(_ydTokenAddress != address(0), "Invalid token address");
        // 将YDToken合约地址赋值给ydToken变量
        ydToken = IERC20(_ydTokenAddress);
    }

    // 创建课程，参数为标题，描述，价格
    function createCourse(string memory _title, string memory _metadataUrl, uint _price) external {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_price > 0, "Price must be greater than zero");

        // 生成自增的课程 ID
        uint courseId = nextCourseId;
        courses[courseId] = Course({
            id: courseId,
            title: _title,
            // 描述，封面图片等大体积数据，存储在IPFS上
            metadataUrl: _metadataUrl,
            price: _price,
            // 作者地址，调用方法的就是作者
            author: payable(msg.sender)
        });
        // 自增课程 ID
        nextCourseId++;

        // 触发创建课程事件
        emit CourseCreated(courseId, msg.sender, _price, _title);
    }

    // 购买课程，参数为课程 ID
    // nonReentrant: 这是来自 ReentrancyGuard 的修饰符。它会设置一个锁，确保在本次函数调用完全结束前，
    // 同一个调用者无法再次进入这个函数或其他也标记为 nonReentrant 的函数，从而防止重入攻击。
    // 在调用此函数之前，学生必须先在其钱包中调用 YDToken 合约的 approve 函数，
    // 授权 CoursePlatform 合约可以从学生的账户中转移特定数量（至少等于课程价格）的 YDToken。
    function buyCourse(uint _courseId) external nonReentrant {
        Course storage course = courses[_courseId];
        // 课程不存在、作者或已经购买过，则抛出错误
        require(course.author != address(0), "Course does not exist");
        require(msg.sender != course.author, "Author cannot buy their own course");
        require(!studentEnrollments[_courseId][msg.sender], "Already enrolled");

        uint price = course.price;
        address author = course.author;

        // 从学生账户转移到合约账户
        bool success = ydToken.transferFrom(msg.sender, address(this), price);
        require(success, "Token transfer failed");

        // 记录学生购买课程
        studentEnrollments[_courseId][msg.sender] = true;

        // 增加作者收入
        authorEarnings[author] += price;

        // 触发购买课程事件
        emit CoursePurchased(_courseId, msg.sender, author, price);
    }

    // 提取资金，参数为作者地址，同样使用nonReentrant防止重入攻击
    function withdrawFunds() external nonReentrant {
        // 安全关键点: 采用了 "Checks-Effects-Interactions"（检查-影响-交互）模式。
        // 这个顺序至关重要。如果先转账再清零，恶意攻击者可以在 transfer 函数中再次调用 withdrawFunds，
        // 在余额被清零前提走多笔资金，这就是重入攻击。先清零就杜绝了这种可能。
        uint amount = authorEarnings[msg.sender];
        // 检查是否有收入
        require(amount > 0, "No earnings to withdraw");

        // 影响：将作者收入清零
        authorEarnings[msg.sender] = 0;

        // 交互：将YDToken转移到作者账户
        bool success = ydToken.transfer(msg.sender, amount);
        require(success, "Token transfer failed");

        // 触发提取资金事件
        emit FundsWithdrawn(msg.sender, amount);
    }

    /**
     * 性能警告：
     * 就像代码注释里说的，这两种在合约内部进行循环的模式，如果课程数量非常多，会让函数变得效率低下。
     * 对于前端应用来说，调用是免费的，但可能需要等待更长时间；
     * 如果是在另一个智能合约里调用这种函数，会消耗大量Gas，甚至可能因为超出Gas限制而失败。
     * 因此，在真实的大型应用中，更专业的做法是使用链下索引服务（如 The Graph）来处理这类数据查询需求。
     */

    // 视图函数，获取某个学生购买的所有课程列表，参数为学生地址
    function getEnrolledCourses(address _student) external view returns (uint[] memory) {
        uint count = 0;
        // 获取该学生一共购买了多少课程，因为enrolledIds动态数组在创建的时候要知道数组有多大
        for (uint i = 0; i < nextCourseId; i++) {
            if (studentEnrollments[i][_student]) {
                count++;
            }
        }

        uint[] memory enrolledIds = new uint[](count);
        uint index = 0;
        // 将该学生购买的所有课程的id放入到enrolledIds动态数组中
        for (uint i = 0; i < nextCourseId; i++) {
            if (studentEnrollments[i][_student]) {
                enrolledIds[index] = i;
                index++;
            }
        }
        return enrolledIds;
    }

    // 视图函数，获取并返回平台上所有存在过的课程的详细信息列表。
    function getAllCourses() external view returns (Course[] memory) {
        // 因为nextCourseId变量本身一直记录着课程总数，所以不需要动态计算数组大小
        Course[] memory allCourses = new Course[](nextCourseId);
        for (uint i = 0; i < nextCourseId; i++) {
            allCourses[i] = courses[i];
        }
        return allCourses;
    }
}
