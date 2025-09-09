// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// ERC20.sol: 这是一个标准的 ERC20 代币实现。
// Ownable.sol: 这是一个标准的 Ownable 合约实现。这个合约提供了一个简单的访问控制机制。
// 它会设定一个合约的“所有者”（Owner），并提供一个 onlyOwner 修饰符，可以用来限制某些函数只能由所有者调用。

contract YDToken is ERC20, Ownable {
    // 需要一个初始地址作为合约拥有者
    // 调用父合约ERC20的构造函数，设置代币名称YD Token和符号YD
    // 调用父合约Ownable的构造函数，设置初始拥有者
    constructor(address initialOwner) ERC20("YD Token", "YD") Ownable(initialOwner) {
        // msg.sender为部署合约的地址，调用ERC20内部铸币函数_mint，铸造10亿枚代币
        // decimals() 是 ERC20 合约中的一个函数，返回代币的小数位数，默认是18
        _mint(msg.sender, 1000000000 * 10 ** decimals());
    }

    // 允许合约拥有者铸造代币，外部可调用
    function mint(address to, uint256 amount) public onlyOwner {
        // 调用父合约ERC20的内部铸币函数_mint，铸造代币
        _mint(to, amount);
    }
}

/**
 * 解释YDToken的铸造数量1000000000 * 10 ** decimals()是什么意思？
 * 想象一下人民币。我们平时说“100块钱”，但实际上银行系统里记录的最小单位是“分”。
1元 = 100分
如果你要在银行系统里记录“100元”，你不会存一个数字 100.00，因为计算机处理小数（浮点数）既慢又不精确，在金融领域是大忌。所以，系统会把它转换成最小单位来存储，也就是 100 * 100 = 10000 分。
系统内部只跟整数 10000 打交道。当需要显示给用户看时，再把它除以 100，变回 100.00元。
现在回到我们的代码: 1000000000 * 10 ** decimals()
1. decimals() 是什么？
decimals() 是 ERC20代币标准里的一个函数，它的作用就相当于上面例子里的“1元等于多少分”。它告诉你这个代币的小数位数，或者说精度。
对于人民币，“小数位数”是 2 (角、分)。所以 1 元 = 10^2 = 100 分。
在以太坊和大多数ERC20代币的世界里，这个值通常被约定俗成地设置为 18。
所以，decimals() 这个函数会返回 18。
2. 10 ** decimals() 是什么？
这句代码是计算 10 的 decimals() 次方。
既然 decimals() 返回 18，那么 10 ** decimals() 就等于 10 ** 18，也就是 1 后面跟 18 个零：
1,000,000,000,000,000,000
这个巨大的数字，就代表了一个完整的 "YD Token"。它就是 YD Token 世界里的“1元”，只不过它等于 10^18 个最小单位，而不是100个“分”。
以太坊本身也是这样计价的：
1 Ether = 1,000,000,000,000,000,000 Wei (Wei 是以太坊的最小单位)
 */
