# Linux 文档阅读：man page、通配符和文件层级

这篇笔记记录阅读 Linux / Unix man page 时常见的英文和术语。

## SYNOPSIS

`SYNOPSIS` 在 man page 里是“概要 / 用法概要 / 命令格式”。

例如：

```text
SYNOPSIS
     chown [-fhnv] [-R [-H | -L | -P]] owner[:group] file ...
```

可以理解成：

```text
先别解释细节，直接告诉我这条命令怎么写。
```

常见 man page 标题：

```text
NAME         命令名字和一句话说明
SYNOPSIS     命令格式
DESCRIPTION  详细说明
OPTIONS      选项说明
EXAMPLES     示例
SEE ALSO     相关命令
```

## file hierarchies

`file hierarchies` 是“文件层级结构”或“目录树”。

例如：

```text
project/
  src/
    main.py
  docs/
    README.md
```

这就是一个 file hierarchy。

文档里如果写：

```text
Change the user ID and/or the group ID of the file hierarchies rooted in the files,
instead of just the files themselves.
```

重点短语是：

```text
file hierarchies rooted in the files
```

意思是“以这些文件或目录为根的整棵目录树”。这通常对应递归操作，例如：

```bash
chown -R user:group mydir
```

也就是修改 `mydir` 本身，以及它下面所有子目录和文件。

## wildcards

`wildcards` 是“通配符”。

常见例子：

```bash
*
.*
?.txt
file[0-9].log
```

`*` 可以匹配任意字符序列。`.*` 常用于匹配隐藏文件，但递归操作时要小心。

## hard link

`hard link` 是“硬链接”，不是 hard code。

在 Unix/Linux 文件系统中，一个文件名本质上是指向 inode 的目录项。多个文件名可以指向同一个 inode，这些名字之间就是 hard links。

特殊目录项：

```text
.   当前目录
..  父目录
```

所以文档里说：

```text
".." hard link to the parent directory
```

意思是 `..` 是指向父目录的特殊目录项。

如果写：

```bash
chown -R user:group .*
```

某些情况下 `.*` 可能匹配到 `..`，递归操作就可能跑到父目录，范围会失控。

## useradd 常用方式

`man useradd` 更像参数字典，不像教程。

创建用户并创建 home 目录：

```bash
sudo useradd -m zhangsan
sudo passwd zhangsan
```

指定 shell：

```bash
sudo useradd -m -s /bin/bash zhangsan
sudo passwd zhangsan
```

加入 sudo 组：

```bash
sudo usermod -aG sudo zhangsan
```

CentOS/RHEL 常见 sudo 权限组是 `wheel`：

```bash
sudo usermod -aG wheel zhangsan
```

## Vim 关闭搜索高亮

临时关闭 `/关键词` 搜索后的高亮：

```vim
:noh
```

完整写法：

```vim
:nohlsearch
```

永久关闭搜索高亮：

```vim
:set nohlsearch
```

写入 `~/.vimrc`：

```vim
set nohlsearch
```

