import { useState, useRef, useEffect } from 'react';
import { StudyModule } from '../types';
import { AlertTriangle, Map, ShieldAlert, Terminal, BookOpen, PenTool, Flag, Copy, Check, Upload } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ArpDiagram } from './ArpDiagram';

interface ModuleViewProps {
  module: StudyModule;
}

export function ModuleView({ module }: ModuleViewProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [allCommandsCopied, setAllCommandsCopied] = useState(false);
  const [dryRunOutputs, setDryRunOutputs] = useState<Record<number, string>>({});
  const [loadingOutputs, setLoadingOutputs] = useState<Record<number, boolean>>({});
  const [fileHash, setFileHash] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [interactiveMode, setInteractiveMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
  const [arpTableState, setArpTableState] = useState<'before' | 'after'>('before');

  useEffect(() => {
      setInteractiveMode(false);
      setCurrentStep(0);
      setIsReplaying(false);
  }, [module.id]);

  const handleCopyCmd = (cmd: string, index: number) => {
    navigator.clipboard.writeText(cmd).catch(() => {});
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    const allCmds = module.commands.map(c => c.cmd).join('\n');
    navigator.clipboard.writeText(allCmds).catch(() => {});
    setAllCommandsCopied(true);
    setTimeout(() => setAllCommandsCopied(false), 2000);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(module, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${module.title.replace(/\s+/g, '-').toLowerCase()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setFileHash(hashHex);
  }

  const handleReplaySession = async () => {
      setIsReplaying(true);
      setInteractiveMode(false);
      setDryRunOutputs({});
      
      for (let i = 0; i < module.commands.length; i++) {
          await new Promise<void>(resolve => {
              setLoadingOutputs(prev => ({ ...prev, [i]: true }));
              setTimeout(() => {
                  setDryRunOutputs(prev => ({
                      ...prev,
                      [i]: getMockOutput(module.commands[i].description || '', module.commands[i].cmd)
                  }));
                  setLoadingOutputs(prev => ({ ...prev, [i]: false }));
                  resolve();
              }, 1000);
          });
      }
      setIsReplaying(false);
  };

  const getAutoDesc = (cmd: string) => {
    const lowerCmd = cmd.toLowerCase();
    if (lowerCmd.startsWith('search')) return 'Search exploit/tool';
    if (lowerCmd.startsWith('use')) return 'Load module';
    if (lowerCmd.startsWith('exploit') || lowerCmd.startsWith('run')) return 'Execute exploit';
    if (lowerCmd.startsWith('tshark') || lowerCmd.startsWith('wireshark') || lowerCmd.startsWith('tcpdump')) return 'Capture/Analyze traffic';
    if (lowerCmd.startsWith('burp')) return 'Proxy configuration';
    if (lowerCmd.startsWith('wpscan')) return 'Scan target';
    if (lowerCmd.startsWith('nmap')) return 'Network scan';
    if (lowerCmd.includes('sqlmap')) return 'SQL injection testing';
    if (lowerCmd.includes('dirb') || lowerCmd.includes('gobuster')) return 'Directory enumeration';
    if (lowerCmd.includes('john') || lowerCmd.includes('hashcat')) return 'Password cracking';
    if (lowerCmd.includes('msfconsole')) return 'Launch Metasploit framework';
    if (lowerCmd.includes('schtasks')) return 'Manage Scheduled Tasks';
    if (lowerCmd.includes('mimikatz')) return 'Extract Credentials';
    if (lowerCmd.includes('crackmapexec')) return 'Active Directory Enumeration';
    if (lowerCmd.startsWith('set ') || lowerCmd.startsWith('setg ')) return 'Configure module parameter';
    if (lowerCmd.startsWith('cat') || lowerCmd.startsWith('type') || lowerCmd.startsWith('tail') || lowerCmd.startsWith('head')) return 'View file contents';
    if (lowerCmd.startsWith('ls') || lowerCmd.startsWith('dir')) return 'List directory contents';
    if (lowerCmd.startsWith('ping')) return 'Check host connectivity';
    if (lowerCmd.startsWith('nc') || lowerCmd.startsWith('netcat') || lowerCmd.includes(' netcat ')) return 'Network connection/listener';
    if (lowerCmd.startsWith('hydra')) return 'Brute-force login';
    if (lowerCmd.includes('wevtutil')) return 'Manage Windows Event Logs';
    if (lowerCmd.includes('curl ') || lowerCmd.includes('wget ')) return 'Transfer Data / Download File';
    if (lowerCmd.includes('chmod ')) return 'Change File Permissions';
    if (lowerCmd.includes('chown ')) return 'Change File Owner';
    if (lowerCmd.includes('ipconfig') || lowerCmd.includes('ifconfig') || lowerCmd.includes('ip addr')) return 'View Network Configuration';
    if (lowerCmd.includes('whoami')) return 'View Current User';
    return 'Execute command';
  };

  const getMockOutput = (desc: string, cmd: string) => {
    const d = desc.toLowerCase();
    const c = cmd.toLowerCase();
    
    // Scan/Enumerate
    if (d.includes('scan') || c.includes('scan') || c.includes('nmap') || c.includes('wpscan') || c.includes('enumerate') || d.includes('enum') || c.includes('crackmapexec')) {
        const outputs = [
            'Starting Nmap 7.93 ( https://nmap.org ) at ' + new Date().toISOString() + '\nNmap scan report for target (10.0.0.5)\nHost is up (0.0012s latency).\nNot shown: 997 closed tcp ports (reset)\nPORT     STATE SERVICE\n22/tcp   open  ssh\n80/tcp   open  http\n443/tcp  open  https\nDevice type: general purpose\nRunning: Linux 5.X\nOS CPE: cpe:/o:linux:linux_kernel:5.4\nOS details: Linux 5.4 - 5.10\nNmap done: 1 IP address (1 host up) scanned in 1.45 seconds',
            'Running WPScan...\n[+] URL: http://10.0.0.5/\n[+] Started: ' + new Date().toISOString() + '\n\n[i] Updating the Database ...\n[i] Update completed.\n\n[+] WordPress version 6.2 identified (Insecure, released on 2023-03-29).\n | Found By: Emoji Settings (Passive Detection)\n\n[+] Enumerating Users\n Brute Forcing Author IDs - Time: 00:00:01 <=====================> (10 / 10) 100.00%\n\n[i] User(s) Identified:\n\n[+] admin\n | Found By: Author Posts - Author Pattern',
            'CrackMapExec - SMB\n[*] 10.0.0.5:445  (name:DC01) (domain:COSEC.LOCAL) (signing:True) (SMBv1:False)\n[+] COSEC.LOCAL\\admin:Password123! (Pwn3d!)'
        ];
        return outputs[Math.floor(Math.random() * outputs.length)];
    }
    
    // Filesystem/File listing
    if (d.includes('list') || d.includes('files') || c.includes('ls') || c.includes('dir')) {
        const outputs = [
            'total 40\ndrwxr-xr-x 4 root root  4096 May 15 19:40 .\ndrwxr-xr-x 6 root root  4096 May 14 10:20 ..\n-rw------- 1 root root  1024 May 15 19:35 .bash_history\n-rw-r--r-- 1 root root  2048 May 15 19:38 config.php\n-rwsr-xr-x 1 root root 15000 May 10 11:11 backup.sh\n-rw-r--r-- 1 root root   512 May 15 19:35 database.yml',
            'total 24\ndrwxrwx--- 2 www-data www-data 4096 May 16 01:22 html\ndrwxr-xr-x 3 root     root     4096 May 14 09:12 logs\n-rw-r--r-- 1 root     root     8192 May 16 02:04 .htpasswd\n-rwxrwxr-x 1 root     root     1024 May 16 02:04 update.sh',
            'Directory of C:\\Users\\Administrator\\Desktop\n\n05/19/2026  12:00 AM    <DIR>          .\n05/19/2026  12:00 AM    <DIR>          ..\n05/18/2026  10:30 AM             1,452 passwords.txt\n05/17/2026  09:15 AM            24,512 confidential_report.pdf\n               2 File(s)         25,964 bytes\n               2 Dir(s)  14,562,112,000 bytes free'
        ];
        return outputs[Math.floor(Math.random() * outputs.length)];
    }

    // View file contents
    if (d.includes('view') || d.includes('read') || c.startsWith('cat ') || c.startsWith('tail ') || c.startsWith('type '))
        return 'root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nbin:x:2:2:bin:/bin:/usr/sbin/nologin\nsys:x:3:3:sys:/dev:/usr/sbin/nologin\n[...truncated...]';

    // Capture / Traffic
    if (d.includes('capture') || c.includes('capture') || c.includes('tshark') || c.includes('tcpdump')) 
        return 'Capturing packets...\n10.0.0.1 -> 10.0.0.5 ARP Reply [Gratuitous]\n192.168.1.1 -> 192.168.1.5 TCP SYN\n[...truncated 120 lines...]\nCaptured 154 packets.';
    
    // Proxy
    if (d.includes('proxy') || c.includes('burp')) 
        return 'Burp Suite proxy listening at 127.0.0.1:8080.\nIntercepting traffic...';
    
    // Password Cracking
    if (d.includes('crack') || c.includes('john') || c.includes('hashcat'))
        return 'Loaded 1 password hash...\nPress \'q\' or Ctrl-C to abort, almost any other key for status\nadmin:password123 (admin)\n1g 0:00:00:03 DONE 0.285g/s 454p/s 454c/s 454C/s 123456..password\nUse the "--show" option to display all of the cracked passwords reliably';
        
    // Brute-force
    if (d.includes('brute') || c.includes('hydra'))
        return 'Hydra v9.1 (c) by van Hauser/THC\nHydra starting at ' + new Date().toISOString() + '\n[DATA] attacking ssh://10.0.0.5:22/\n[22][ssh] host: 10.0.0.5   login: admin   password: password1';

    // Exploit
    if (d.includes('exploit') || c.includes('exploit') || c.includes('msfconsole') || c.includes('use') || c.startsWith('run')) 
        return 'Initializing exploit sequence...\nPayload delivered successfully.\nSession 1 opened: 10.0.0.5:4444 -> 10.0.0.1:56782\nSystem access granted.';
        
    // Scheduled Tasks
    if (d.includes('task') || c.includes('schtasks'))
        return 'SUCCESS: The scheduled task "TestTask" has successfully been created.\n';

    // Credentials Extraction
    if (d.includes('credential') || c.includes('mimikatz'))
        return '  .#####.   mimikatz 2.2.0 (x64) #19041 Aug 10 2021 17:19:53\n .## ^ ##.\n ## / \\ ##  /* * *\n ## \\ / ##   Benjamin DELPY `gentilkiwi` ( benjamin@gentilkiwi.com )\n \'## v ##\'   http://blog.gentilkiwi.com/mimikatz             (oe.eo)\n  \'#####\'    * * */\n\nmimikatz # sekurlsa::logonpasswords\nAuthentication Id : 0 ; 996 (00000000:000003e4)\nSession           : Service from 0\nUser Name         : SYSTEM\nDomain            : WORKGROUP\nLogon Server      : (null)\nLogon Time        : 5/19/2026 12:00:00 AM\nSID               : S-1-5-18\n[...truncated...]';

    // Network / IP Configure
    if (c.includes('ipconfig') || c.includes('ifconfig') || c.includes('ip addr'))
        return 'Windows IP Configuration\n\nEthernet adapter Ethernet0:\n\n   Connection-specific DNS Suffix  . : localdomain\n   IPv4 Address. . . . . . . . . . . : 10.0.0.5\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 10.0.0.1\n';

    // Privilege / User info
    if (c.includes('whoami'))
        return 'NT AUTHORITY\\SYSTEM';

    // Generic
    return 'Dry Run Execution: Command successful.\nStatus Code: 200 OK\nTimestamp: ' + new Date().toISOString();
  }

  const runDry = (cmd: { description?: string, cmd: string }, index: number) => {
    setLoadingOutputs(prev => ({ ...prev, [index]: true }));
    setTimeout(() => {
        setDryRunOutputs(prev => ({
            ...prev,
            [index]: getMockOutput(cmd.description || '', cmd.cmd)
        }));
        setLoadingOutputs(prev => ({ ...prev, [index]: false }));
    }, 1000);
  };

  const getLanguage = (output: string) => {
    const trimmed = output.trim();
    // Windows Event Log
    if (/(?:^[A-Z][a-z]{2}(?:,|\s)\s+\d{1,2}(?:,|\s)\s+\d{4}\s+\d{1,2}:\d{2}:\d{2}\s+[AP]M)|(?:Log Name:\s|Source:\s|Event ID:\s|Level:\s+(?:Information|Warning|Error|Critical))/im.test(trimmed)) return 'log';
    // Linux Auth log, Syslog, or mixed log content
    if (/(?:^[A-Z][a-z]{2}\s+\d{1,2}\s\d{2}:\d{2}:\d{2}\s\S+)|(?:\[?(?:ERROR|WARN|WARNING|INFO|DEBUG|FATAL|TRACE|EXCEPTION)\]?[:\s])/im.test(trimmed)) return 'log';
    // Apache access log
    if (/(?:(\d{1,3}\.){3}\d{1,3}\s-\s-\s\[\d{2}\/[A-Za-z]{3}\/\d{4}:\d{2}:\d{2}:\d{2}\s[+-]?\d{4}\]\s".*?"\s\d{3}\s\d+)/m.test(trimmed)) return 'apache';
    
    if (trimmed.startsWith('{') || (trimmed.startsWith('[') && trimmed.endsWith(']'))) return 'json';
    if (/<\w+[^>]*>|<\/\w+>|<\w+\s*\/?>/.test(trimmed)) return 'xml';
    if (/^[-A-Za-z0-9_]+:\s+/.test(trimmed) || trimmed.includes('\n- ')) return 'yaml';
    return 'bash';
  };

  // Pagination for long output
  const PaginatedOutput = ({ output }: { output: string }) => {
    const lines = output.replace(/\r/g, '').split('\n');
    const [isExpanded, setIsExpanded] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
    const [filterText, setFilterText] = useState('');
    const [showFilter, setShowFilter] = useState(false);

    // New feature states
    const [diffMode, setDiffMode] = useState(false);
    const [autoScroll, setAutoScroll] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [copiedNotification, setCopiedNotification] = useState(false);

    // History comparison for diff feature
    const [prevOutput, setPrevOutput] = useState<string | null>(null);
    const lastOutputRef = useRef<string>(output);

    useEffect(() => {
        if (output !== lastOutputRef.current) {
            setPrevOutput(lastOutputRef.current);
            lastOutputRef.current = output;
        }
    }, [output]);

    // Keyboard shortcut (Ctrl+C / Cmd+C for full unfiltered output copy when component is hovered)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isHovered && (e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
                e.preventDefault();
                navigator.clipboard.writeText(output)
                    .then(() => {
                        setCopiedNotification(true);
                        setTimeout(() => setCopiedNotification(false), 2000);
                    })
                    .catch(() => {});
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isHovered, output]);

    // Auto-scroll anchor and effect
    const bottomRef = useRef<HTMLDivElement>(null);

    const pageSize = 15;
    const filteredLines = filterText ? lines.filter(l => l.toLowerCase().includes(filterText.toLowerCase())) : lines;
    const displayedLines = isExpanded ? filteredLines : filteredLines.slice(0, pageSize);
    const hasMore = filteredLines.length > pageSize;

    // Line level diff logic
    interface DiffLine {
        type: 'added' | 'removed' | 'unchanged';
        text: string;
    }

    const diffLines = (oldL: string[], newL: string[]): DiffLine[] => {
        const matrix: number[][] = Array(oldL.length + 1).fill(null).map(() => Array(newL.length + 1).fill(0));
        
        for (let i = 1; i <= oldL.length; i++) {
            for (let j = 1; j <= newL.length; j++) {
                if (oldL[i - 1] === newL[j - 1]) {
                    matrix[i][j] = matrix[i - 1][j - 1] + 1;
                } else {
                    matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
                }
            }
        }
        
        const diff: DiffLine[] = [];
        let i = oldL.length;
        let j = newL.length;
        
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && oldL[i - 1] === newL[j - 1]) {
                diff.unshift({ type: 'unchanged', text: oldL[i - 1] });
                i--;
                j--;
            } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
                diff.unshift({ type: 'added', text: newL[j - 1] });
                j--;
            } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
                diff.unshift({ type: 'removed', text: oldL[i - 1] });
                i--;
            }
        }
        
        return diff;
    };

    const oldLinesArray = prevOutput ? prevOutput.replace(/\r/g, '').split('\n') : [];
    const diffLinesArray = diffLines(oldLinesArray, lines);
    const filteredDiffLines = filterText 
        ? diffLinesArray.filter(l => l.text.toLowerCase().includes(filterText.toLowerCase())) 
        : diffLinesArray;
    const displayedDiffLines = isExpanded ? filteredDiffLines : filteredDiffLines.slice(0, pageSize);
    const hasMoreDiff = filteredDiffLines.length > pageSize;

    const hasMoreLines = diffMode ? hasMoreDiff : hasMore;

    useEffect(() => {
        if (autoScroll && bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [displayedLines, displayedDiffLines, autoScroll]);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    const closeMenu = () => setContextMenu(null);

    useEffect(() => {
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    const copyOutput = () => {
        navigator.clipboard.writeText(output).catch(() => {});
    };

    const saveLog = () => {
        const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(output);
        const a = document.createElement('a');
        a.href = dataStr;
        a.download = "console-output.log";
        a.click();
    };

    // Export button → downloads current displayed output as output_<timestamp>.txt
    const handleExportText = () => {
        let exportContent = '';
        if (diffMode) {
            exportContent = displayedDiffLines.map(line => {
                const prefix = line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '  ';
                return prefix + line.text;
            }).join('\n');
        } else {
            exportContent = displayedLines.join('\n');
        }
        
        const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `output_${timestamp}.txt`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div 
            className="relative border-b border-stone-800" 
            onContextMenu={handleContextMenu}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {copiedNotification && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-emerald-500 text-black px-3 py-1 text-[10px] font-bold font-mono rounded tracking-wider shadow-lg z-50 animate-bounce">
                    [ FULL OUTPUT COPIED TO CLIPBOARD ]
                </div>
            )}

            {showFilter && (
                <div className="px-3 py-2 bg-stone-900 border-b border-stone-800 flex items-center">
                    <input 
                        type="text" 
                        autoFocus
                        value={filterText}
                        onChange={e => setFilterText(e.target.value)}
                        placeholder="Filter output..." 
                        className="bg-black text-stone-300 text-xs px-2 py-1 border border-stone-700 rounded w-full font-mono outline-none focus:border-emerald-500"
                    />
                    <button onClick={() => {setShowFilter(false); setFilterText('');}} className="ml-2 text-stone-500 hover:text-stone-300 outline-none">x</button>
                </div>
            )}

            {/* Aesthetic, high-utility control panel */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-stone-900 border-b border-stone-800 text-[10px] font-mono text-stone-400">
                <div className="flex items-center space-x-2">
                    <span>
                        {diffMode 
                            ? `${displayedDiffLines.length}/${filteredDiffLines.length} diff lines` 
                            : hasMore && !isExpanded 
                                ? `${pageSize}/${filteredLines.length} lines` 
                                : `${filteredLines.length} lines`
                        }
                    </span>
                    <span className="text-stone-700">|</span>
                    <span className="text-[9px] text-stone-600 hidden sm:inline">Ctrl+C to copy full</span>
                </div>
                
                <div className="flex items-center space-x-2">
                    {/* Diff Mode Button */}
                    <button 
                        onClick={() => setDiffMode(prev => !prev)}
                        className={`px-1.5 py-0.5 rounded transition-all text-[9px] font-bold ${
                            diffMode 
                                ? 'bg-rose-950/50 text-rose-400 border border-rose-900/50' 
                                : 'hover:bg-stone-800 border border-stone-800 text-stone-400'
                        }`}
                        title="Compare current output with previous output"
                    >
                        DIFF
                    </button>

                    {/* Auto-Scroll Button */}
                    <button 
                        onClick={() => setAutoScroll(prev => !prev)}
                        className={`px-1.5 py-0.5 rounded transition-all text-[9px] font-bold ${
                            autoScroll 
                                ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/50' 
                                : 'hover:bg-stone-800 border border-stone-800 text-stone-400'
                        }`}
                        title="Auto-scroll to latest entries"
                    >
                        SCROLL
                    </button>

                    {/* Export Button */}
                    <button 
                        onClick={handleExportText}
                        className="px-1.5 py-0.5 rounded hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 transition-all text-[9px] font-bold"
                        title="Download current displayed log"
                    >
                        EXPORT
                    </button>
                </div>
            </div>

            {diffMode ? (
                <div className="font-mono text-[11px] leading-relaxed overflow-x-auto p-4 bg-stone-950/20 max-h-[450px] overflow-y-auto">
                    {!prevOutput && (
                        <div className="bg-amber-950/20 border border-amber-900/40 text-amber-500 text-[10px] p-2 mb-3 rounded font-mono">
                            COMPARISON: No previous output captured to compare. Current execution marked as full addition. Run again to diff consecutive outputs.
                        </div>
                    )}
                    {displayedDiffLines.map((line, idx) => (
                        <div 
                            key={idx} 
                            className={`px-2 py-0.5 whitespace-pre-wrap rounded flex items-start ${
                                line.type === 'added' 
                                    ? 'bg-emerald-950/30 text-emerald-400 border-l-2 border-emerald-500' 
                                    : line.type === 'removed' 
                                    ? 'bg-rose-950/30 text-rose-400 border-l-2 border-rose-500 line-through' 
                                    : 'text-stone-300'
                            }`}
                        >
                            <span className="w-4 shrink-0 font-mono text-stone-600 select-none">
                                {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                            </span>
                            <span>{line.text}</span>
                        </div>
                    ))}
                    {displayedDiffLines.length === 0 && (
                        <div className="text-stone-500 italic p-2">No matching diff lines.</div>
                    )}
                </div>
            ) : (
                <SyntaxHighlighter
                    language={getLanguage(output)}
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, padding: '1.25rem 1rem', background: 'transparent', fontSize: '0.8rem' }}
                    wrapLines={true}
                    wrapLongLines={false}
                >
                    {displayedLines.join('\n')}
                </SyntaxHighlighter>
            )}

            {hasMoreLines && !isExpanded && (
                <button 
                  onClick={() => setIsExpanded(true)}
                  className="mx-4 mb-2 text-xs text-stone-500 hover:text-emerald-400 font-mono underline block"
                >
                    Load More...
                </button>
            )}

            <div ref={bottomRef} className="h-1" />
            
            {contextMenu && (
                <div 
                    className="fixed bg-stone-900 border border-stone-700 rounded shadow-xl z-50 py-1 text-xs font-mono w-48"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button onClick={copyOutput} className="w-full text-left px-4 py-2 hover:bg-stone-800 text-stone-300">Copy Selection (Browser)</button>
                    <button onClick={() => { navigator.clipboard.writeText(output).catch(() => {}); closeMenu(); }} className="w-full text-left px-4 py-2 hover:bg-stone-800 text-stone-300">Copy Full Output</button>
                    <button onClick={() => { handleExportText(); closeMenu(); }} className="w-full text-left px-4 py-2 hover:bg-stone-800 text-stone-300">Export (.txt)</button>
                    <button onClick={() => { setDiffMode(prev => !prev); closeMenu(); }} className="w-full text-left px-4 py-2 hover:bg-stone-800 text-stone-300">
                        {diffMode ? 'Disable Diff Mode' : 'Enable Diff Mode'}
                    </button>
                    <button onClick={() => { setAutoScroll(prev => !prev); closeMenu(); }} className="w-full text-left px-4 py-2 hover:bg-stone-800 text-stone-300">
                        {autoScroll ? 'Disable Auto-Scroll' : 'Enable Auto-Scroll'}
                    </button>
                    <button onClick={() => {setShowFilter(true); closeMenu();}} className="w-full text-left px-4 py-2 hover:bg-stone-800 text-stone-300">Filter output</button>
                    {hasMoreLines && !isExpanded && (
                        <button onClick={() => {setIsExpanded(true); closeMenu();}} className="w-full text-left px-4 py-2 hover:bg-stone-800 text-stone-300">View Full Output</button>
                    )}
                </div>
            )}
        </div>
    );
  }

  // CISA Feed
  const [cisaAlerts, setCisaAlerts] = useState<any[]>([]);
  const [cisaStatus, setCisaStatus] = useState<'loading' | 'error' | 'success'>('loading');
  useEffect(() => {
    if (module.id === 'live-threat-intel') {
      const fetchAlerts = () => {
        setCisaStatus('loading');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        fetch('https://www.cisa.gov/api/cybersecurity-advisories/all.json', { signal: controller.signal })
          .then(res => res.json())
          .then(data => {
            setCisaAlerts(data.slice(0, 5));
            setCisaStatus('success');
            clearTimeout(timeoutId);
          })
          .catch(() => {
             setCisaStatus('error');
             clearTimeout(timeoutId);
          });
      }
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 3600000); // 1 hour
      return () => clearInterval(interval);
    }
  }, [module.id]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {module.id === 'live-threat-intel' && (
            <section className="bg-stone-900 border border-stone-800 rounded-lg p-6 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-widest font-mono text-emerald-400">Live CISA Alerts</h3>
                {cisaStatus === 'loading' && (
                    <div className="flex items-center space-x-2 text-stone-500 font-mono text-xs">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                        <span>Fetching threat intel...</span>
                    </div>
                )}
                {cisaStatus === 'error' && (
                    <div className="text-xs text-rose-400 font-mono">Failed to load alerts. Request timed out or node offline.</div>
                )}
                {cisaStatus === 'success' && (
                    <ul className="space-y-2">
                        {cisaAlerts.map((a, i) => <li key={i} className="text-sm text-stone-300 font-mono">- {a.title}</li>)}
                    </ul>
                )}
            </section>
        )}
      
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 flex items-start space-x-4">
        <AlertTriangle className="w-6 h-6 text-rose-500 flex-shrink-0 mt-0.5" />
        <div>
          <h2 className="text-sm font-bold text-rose-500 tracking-wider">FOR AUTHORIZED LAB USE ONLY</h2>
          <p className="text-xs text-rose-400/80 mt-1">All active testing must be conducted within the air-gapped authorized VM lab (172.20.0.0/24). Scope confirmation is required before any active module is executed. Executing these tools against unconsenting networks violates federal law.</p>
        </div>
      </div>

      <div className="flex justify-between items-start">
        <h1 className="text-3xl font-bold tracking-tight text-stone-100">
          {module.title}
          {interactiveMode && (
              <span className="ml-4 text-sm font-mono text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 rounded-full align-middle whitespace-nowrap">
                  Lab Step {currentStep + 1} / {module.commands.length}
              </span>
          )}
        </h1>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-stone-800 text-stone-300 text-sm rounded-md hover:bg-stone-700 transition-colors"
        >
          Export Module
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Content Column */}
        <div className="col-span-2 space-y-8">
          
          <section className="space-y-3">
            <div className="flex items-center space-x-2 text-stone-400">
              <BookOpen className="w-4 h-4" />
              <h3 className="text-sm font-semibold uppercase tracking-widest font-mono">Theory</h3>
            </div>
            {module.id === 'mitm-offense' && <ArpDiagram />}
            <div className="bg-stone-900 rounded-lg p-5 border border-stone-800 text-stone-300 text-sm leading-relaxed">
              {module.theory}
            </div>
            {module.realWorldExample && (
                <div className="bg-stone-950 rounded-lg p-5 border border-stone-800 border-l-4 border-l-amber-500 text-stone-300 text-sm leading-relaxed mt-4">
                    <span className="text-amber-500 font-bold block mb-2 font-mono uppercase tracking-widest text-xs">Real-World Case Study</span>
                    {module.realWorldExample}
                </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between text-stone-400">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4" />
                <h3 className="text-sm font-semibold uppercase tracking-widest font-mono">Commands</h3>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleReplaySession}
                  disabled={isReplaying}
                  className={`flex items-center space-x-1 text-xs font-mono transition-all duration-300 px-3 py-1 rounded-full border ${
                    isReplaying
                      ? 'border-amber-500 text-amber-400 bg-amber-500/10 cursor-not-allowed'
                      : 'border-stone-700 text-stone-400 hover:text-amber-400 hover:border-amber-500/50'
                  }`}
                >
                  {isReplaying ? 'Replaying...' : 'Replay Session'}
                </button>
                <button
                  onClick={() => { setInteractiveMode(!interactiveMode); setCurrentStep(0); }}
                  className={`flex items-center space-x-1 text-xs font-mono transition-all duration-300 px-3 py-1 rounded-full border ${
                    interactiveMode 
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' 
                      : 'border-stone-700 text-stone-400 hover:text-emerald-400 hover:border-emerald-500/50'
                  }`}
                >
                  {interactiveMode ? 'Exit Lab Mode' : 'Start Interactive Lab'}
                </button>
                <button
                  onClick={handleCopyAll}
                  className={`flex items-center space-x-1 text-xs font-mono transition-all duration-300 ${
                    allCommandsCopied ? 'text-emerald-300 scale-105' : 'text-emerald-400 hover:text-emerald-300'
                  }`}
                  aria-label="Copy all commands"
                >
                  {allCommandsCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{allCommandsCopied ? 'Copied All' : 'Copy All'}</span>
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {module.id === 'mitm-offense' && (
                  <div className="bg-rose-950/20 shadow-[0_0_15px_rgba(225,29,72,0.1)] border border-rose-900/50 p-4 rounded-lg mb-4 text-sm font-mono text-stone-300">
                      <span className="text-rose-400 font-bold block mb-2">ARP Spoofing Mechanism:</span>
                      <p className="mb-3">ARP spoofing establishes a MITM position by broadcasting falsified ARP messages over the local network. This associates the attacker's MAC with a legitimate IP (usually the default gateway), tricking devices into routing traffic through the attacker's machine. The attacker can view, modify, or drop packets before forwarding to the actual destination.</p>
                      
                      <div className="bg-black/50 p-3 rounded font-mono text-xs text-rose-200 border border-rose-900/30">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-stone-400 font-semibold uppercase tracking-wider">Target ARP Table</span>
                           <div className="flex bg-stone-900 rounded border border-stone-800 overflow-hidden">
                             <button
                               onClick={() => setArpTableState('before')}
                               className={`px-3 py-1 ${arpTableState === 'before' ? 'bg-stone-800 text-stone-200' : 'text-stone-500'} transition-colors hover:bg-stone-800`}
                             >
                               Before
                             </button>
                             <button
                               onClick={() => setArpTableState('after')}
                               className={`px-3 py-1 ${arpTableState === 'after' ? 'bg-rose-900/40 text-rose-400' : 'text-stone-500'} transition-colors hover:bg-rose-900/20`}
                             >
                               After
                             </button>
                           </div>
                        </div>
                        {arpTableState === 'before' ? (
                            <div className="text-stone-400 p-2 bg-stone-950 rounded border border-stone-800 break-all">Gateway IP <span className="text-stone-500 mx-2">&rarr;</span> GW:MA:CA:DD:RE:SS</div>
                        ) : (
                            <div className="text-stone-400 p-2 bg-rose-950/20 rounded border border-rose-900/40 text-rose-300">Gateway IP <span className="text-rose-500/50 mx-2">&rarr;</span> <span className="text-rose-400 font-bold">AT:TA:CK:ER:MA:CC</span></div>
                        )}
                        <div className="mt-2 text-stone-400">&rarr; Traffic routes through {arpTableState === 'before' ? 'gateway' : <span className="text-rose-400 font-bold">attacker machine</span>}.</div>
                      </div>

                      <div className="mt-4 bg-black p-3 rounded border border-stone-800 font-mono text-[11px] overflow-x-auto text-stone-500 whitespace-pre text-center">
{`[Target 10.0.0.1]──→[Attacker 10.0.0.99]──→[Gateway 10.0.0.254]
     ↑_____________poisoned ARP_____________↑`}
                      </div>
                      <div className="mt-1 text-[10px] text-stone-500 text-center">traffic rerouted through attacker.</div>
                  </div>
              )}
              {module.id === 'mitm-defense' && (
                  <>
                    <div className="bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] border border-emerald-900/50 p-4 rounded-lg mb-4 text-sm font-mono text-stone-300">
                        <span className="text-emerald-400 font-bold block mb-2">DAI Validation Checks (ip arp inspection validate src-mac dst-mac ip):</span>
                        <ul className="list-disc pl-5 space-y-2 mt-2 text-stone-400">
                            <li><strong className="text-stone-200">src-mac</strong>: validates source MAC matches ARP sender MAC</li>
                            <li><strong className="text-stone-200">dst-mac</strong>: validates destination MAC matches ARP target MAC</li>
                            <li><strong className="text-stone-200">ip</strong>: validates IP addresses are not 0.0.0.0, 255.255.255.255, or multicast</li>
                        </ul>
                        <div className="mt-3 bg-black/50 p-3 rounded text-xs border border-emerald-900/30">
                            <span className="text-stone-400">Example:</span> src-mac=<span className="text-stone-200">AA:BB:CC:DD:EE:FF</span>, ARP sender MAC=<span className="text-rose-400">11:22:33:44:55:66</span><br/>
                            <span className="text-emerald-400 mt-1 inline-block">&rarr; MAC mismatch &rarr; packet dropped by DAI.</span>
                        </div>
                        <div className="mt-3 text-stone-500 text-[11px]">
                            DAI validates ARP packets against DHCP snooping binding table. Packets with MAC/IP mismatches or invalid addresses (0.0.0.0, broadcast, multicast) are dropped before they poison the ARP cache.
                        </div>
                    </div>
                    <div className="bg-sky-950/20 shadow-[0_0_15px_rgba(14,165,233,0.1)] border border-sky-900/50 p-4 rounded-lg mb-4 text-sm font-mono text-stone-300">
                        <span className="text-sky-400 font-bold block mb-2">HTTP Strict Transport Security (HSTS):</span>
                        <ul className="list-disc pl-5 space-y-2 text-stone-400">
                            <li><strong className="text-stone-200">max-age=31536000</strong>: browser enforces HTTPS for 1 year.</li>
                            <li><strong className="text-stone-200">includeSubDomains</strong>: enforcement extends to all subdomains.</li>
                            <li><strong className="text-stone-200">Security</strong>: prevents SSL stripping and protocol downgrade attacks.</li>
                        </ul>
                    </div>
                  </>
              )}
              {(interactiveMode ? [module.commands[currentStep]] : module.commands).map((c, mappedIdx) => {
                const i = interactiveMode ? currentStep : mappedIdx;
                const output = c.output || dryRunOutputs[i];
                const displayName = c.description || getAutoDesc(c.cmd);
                const isDryRun = !c.output && (!!dryRunOutputs[i] || loadingOutputs[i]);
                
                return (
                <div key={i} className="space-y-3">
                  <div className="bg-black rounded-lg border border-stone-800 overflow-hidden flex flex-col">
                    {displayName && (
                      <div className="bg-stone-900/50 px-4 py-2 border-b border-stone-800 text-xs text-stone-400 font-mono flex justify-between items-center">
                        <span># {displayName}</span>
                        {interactiveMode && (
                            <span className="text-emerald-500/80 uppercase">Lab step {currentStep + 1} of {module.commands.length}</span>
                        )}
                      </div>
                    )}
                  <div className="p-4 flex items-start justify-between space-x-4">
                    <pre className="text-emerald-400 font-mono text-sm whitespace-pre-wrap overflow-x-auto" aria-label={`Code: ${displayName}`}>
                      {c.cmd}
                    </pre>
                    <div className="flex flex-col space-y-2 items-end">
                        <button
                          onClick={() => handleCopyCmd(c.cmd, i)}
                          className="text-stone-500 hover:text-stone-300 transition-colors outline-none"
                          aria-label={`Copy command: ${displayName}`}
                          title="Copy command"
                        >
                          {copiedIndex === i ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        {!c.output && !dryRunOutputs[i] && (
                            <div className="flex items-center space-x-2">
                                {module.id === 'post-exploitation' && c.cmd.includes('schtasks /delete') && (
                                    <button
                                        onClick={() => runDry(c, i)}
                                        className="text-amber-500 hover:bg-amber-500/20 bg-amber-500/10 px-2 py-1 rounded text-[10px] uppercase font-mono transition-colors"
                                    >
                                        Clear Scheduled Task
                                    </button>
                                )}
                                <button
                                    onClick={() => runDry(c, i)}
                                    className="text-stone-500 hover:text-emerald-400 text-[10px] uppercase font-mono"
                                    aria-label={`Dry run: ${displayName}`}
                                >
                                    Dry Run
                                </button>
                            </div>
                        )}
                    </div>
                  </div>
                  {(output || loadingOutputs[i]) && (
                    <div className={`border-t ${isDryRun ? 'border-dashed' : 'border-solid'} border-stone-800 bg-stone-950/50 relative`} aria-label={`Command output for ${displayName}`}>
                      <div className="absolute top-2 right-4 text-[10px] uppercase font-mono flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${isDryRun ? (loadingOutputs[i] ? 'bg-amber-500 animate-pulse' : 'bg-amber-500') : 'bg-emerald-500'}`}></span>
                        <span className="text-stone-600">{isDryRun ? 'Dry Run' : 'Actual'} Output</span>
                      </div>
                      {loadingOutputs[i] ? (
                          <div className="p-8 text-center text-stone-500 font-mono text-xs flex items-center justify-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-stone-500"></div>
                              <span>Generating...</span>
                          </div>
                      ) : module.id === 'mitm-defense' && c.cmd === 'show ip arp inspection interfaces' ? (
                          <div className="p-4 pt-10 bg-black overflow-x-auto">
                              <div className="min-w-max">
                                  <table className="w-full text-left text-[11px] font-mono text-stone-300 border-collapse">
                                      <thead>
                                          <tr className="border-b border-stone-800 text-stone-500">
                                              <th className="py-2 px-4 font-normal whitespace-nowrap">Interface</th>
                                              <th className="py-2 px-4 font-normal whitespace-nowrap">Trust State</th>
                                              <th className="py-2 px-4 font-normal whitespace-nowrap">Rate (pps)</th>
                                              <th className="py-2 px-4 font-normal whitespace-nowrap">Interval</th>
                                          </tr>
                                      </thead>
                                      <tbody>
                                          <tr className="border-b border-stone-800/50">
                                              <td className="py-3 px-4 whitespace-nowrap">Fa0/1</td>
                                              <td className="py-3 px-4 text-rose-400 font-medium whitespace-nowrap">Untrusted</td>
                                              <td className="py-3 px-4 whitespace-nowrap">15</td>
                                              <td className="py-3 px-4 text-stone-500 whitespace-nowrap">1</td>
                                          </tr>
                                          <tr>
                                              <td className="py-3 px-4 whitespace-nowrap">Fa0/2</td>
                                              <td className="py-3 px-4 text-emerald-400 font-medium whitespace-nowrap">Trusted</td>
                                              <td className="py-3 px-4 text-stone-500 whitespace-nowrap">None</td>
                                              <td className="py-3 px-4 text-stone-500 whitespace-nowrap">N/A</td>
                                          </tr>
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      ) : (
                          <PaginatedOutput output={output} />
                      )}
                    </div>
                  )}
                  </div>
                  {module.id === 'mitm-offense' && c.cmd.includes('DROP') && (
                      <div className="bg-rose-950/20 shadow-[0_0_15px_rgba(225,29,72,0.1)] border border-rose-900/50 p-3 rounded text-xs text-stone-300 font-mono mt-2">
                        <span className="text-rose-400 font-bold block mb-1">Impact Analysis:</span>
                        Dropping intercepted packets prevents delivery, exhausts connection state, and denies service to legitimate users.
                      </div>
                  )}
                </div>
                );
              })}
              
              {module.id === 'mitm-offense' && !interactiveMode && (
                <div className="mt-8 space-y-4">
                  <div className="flex items-center space-x-2 text-stone-400">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <h3 className="text-sm font-semibold uppercase tracking-widest font-mono text-rose-400">Social Engineering & Phishing</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-stone-900 border border-stone-800 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-stone-300 font-mono mb-3 border-b border-stone-800 pb-2">Common Attack Vectors</h4>
                        <ul className="space-y-3 text-xs text-stone-400">
                            <li><strong className="text-rose-400 font-medium">Email Phishing:</strong> Mass-distributed fraudulent emails mimicking legitimate entities.</li>
                            <li><strong className="text-rose-400 font-medium">Spear Phishing:</strong> Highly targeted attacks tailored to specific individuals or organizations.</li>
                            <li><strong className="text-rose-400 font-medium">Whaling:</strong> Spear phishing aimed specifically at high-profile targets (C-level executives).</li>
                            <li><strong className="text-rose-400 font-medium">Vishing (Voice):</strong> Phishing conducted over phone calls or voice messages.</li>
                            <li><strong className="text-rose-400 font-medium">Smishing (SMS):</strong> Malicious links or deceptive requests sent via text message.</li>
                        </ul>
                    </div>

                    <div className="bg-stone-900 border border-stone-800 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-stone-300 font-mono mb-3 border-b border-stone-800 pb-2">Technical Methods</h4>
                        <ul className="space-y-3 text-xs text-stone-400">
                            <li><strong className="text-sky-400 font-medium">DNS Poisoning:</strong> Corrupting DNS caches to map legitimate domains to malicious IPs.</li>
                            <li><strong className="text-sky-400 font-medium">Homograph Attacks:</strong> Registering domains with identical-looking foreign characters (e.g., <span className="font-mono bg-stone-950 px-1 rounded">gοogle.com</span> vs <span className="font-mono bg-stone-950 px-1 rounded">google.com</span>).</li>
                            <li><strong className="text-sky-400 font-medium">URL Spoofing:</strong> Disguising a malicious URL to look trustworthy.</li>
                            <li><strong className="text-sky-400 font-medium">Fake Login Pages:</strong> Exact UI clones hosted on attacker infrastructure to harvest credentials.</li>
                        </ul>
                    </div>
                  </div>

                  <div className="bg-rose-950/20 shadow-[0_0_15px_rgba(225,29,72,0.1)] border border-rose-900/50 rounded-lg p-4 font-mono text-[11px] text-stone-300">
                    <h4 className="text-rose-400 font-bold mb-3 text-xs">Analysis: Homograph Attack Example</h4>
                    <div className="space-y-2 relative">
                        <div className="flex bg-black/50 p-2 rounded border border-rose-900/30">
                            <span className="w-24 text-stone-500 shrink-0">Real URL:</span>
                            <span className="text-emerald-400 break-all">https://www.paypal.com/login</span>
                        </div>
                        <div className="flex bg-black/50 p-2 rounded border border-rose-900/30">
                            <span className="w-24 text-stone-500 shrink-0">Spoof URL:</span>
                            <span className="text-rose-400 break-all">https://www.pаypal.com/login</span>
                        </div>
                        <div className="mt-3 text-stone-400 pt-2 border-t border-rose-900/30 space-y-2">
                            <div className="flex">
                                <span className="w-24 text-stone-500 shrink-0 block">Indicator:</span>
                                <span>The 'a' in the spoofed URL is Cyrillic (U+0430) instead of Latin (U+0061).</span>
                            </div>
                            <div className="flex">
                                <span className="w-24 text-stone-500 shrink-0 block">Mitigation:</span>
                                <div>
                                  Punycode conversion in modern browsers displays the true domain natively:<br/>
                                  <span className="text-stone-500 mt-1 inline-block">xn--pypal-6xe.com</span> instead of <span className="text-stone-500">pаypal.com</span>. Always check certificates manually or use password managers for strict domain binding.
                                </div>
                            </div>
                        </div>
                    </div>
                  </div>
                </div>
              )}

              {interactiveMode && (
                  <div className="bg-stone-950 border border-stone-800 rounded-lg p-3 flex justify-between items-center shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                      <button 
                        onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                        disabled={currentStep === 0}
                        className={`text-xs font-mono px-4 py-2 rounded transition-all duration-300 ${currentStep === 0 ? 'text-stone-700 bg-transparent border border-transparent opacity-30 cursor-not-allowed hidden md:block' : 'text-stone-300 border border-stone-700 hover:bg-stone-800 hover:text-white hover:border-stone-500'}`}
                      >
                          &larr; Previous Step
                      </button>
                      <div className="text-xs font-mono text-stone-500 px-4">
                          Step <span className="text-emerald-400 font-bold">{currentStep + 1}</span> of {module.commands.length}
                      </div>
                      <button 
                        onClick={() => setCurrentStep(prev => Math.min(module.commands.length - 1, prev + 1))}
                        disabled={currentStep === module.commands.length - 1}
                        className={`text-xs font-mono px-4 py-2 rounded transition-all duration-300 ${currentStep === module.commands.length - 1 ? 'text-emerald-900 border-emerald-900/30 opacity-30 cursor-not-allowed' : 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/50 hover:text-emerald-300 hover:border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]'}`}
                      >
                          Next Step &rarr;
                      </button>
                  </div>
              )}
            </div>
          </section>

          {['polymorphic-malware', 'meterpreter-payload-analysis'].includes(module.id) && (
            <section className="bg-stone-900 rounded-lg p-6 border border-stone-800 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-widest font-mono text-stone-400">Malware Binary Upload</h3>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded hover:bg-emerald-500/20"
                >
                    <Upload className="w-4 h-4"/>
                    <span>Calculate SHA256 Hash</span>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden"/>
                {fileHash && (
                    <div className="text-xs font-mono text-emerald-400 bg-black p-3 rounded border border-emerald-900/50 break-all">
                        <span className="text-stone-500 mr-2">SHA256:</span>
                        {fileHash}
                    </div>
                )}
            </section>
          )}

          {module.codeSnippet && (
            <section className="space-y-3">
              <div className="flex items-center justify-between text-stone-400">
                <div className="flex items-center space-x-2">
                  <PenTool className="w-4 h-4" />
                  <h3 className="text-sm font-semibold uppercase tracking-widest font-mono">Implementation</h3>
                </div>
                <span className="text-xs uppercase font-mono bg-stone-900 px-2 py-1 rounded">{module.codeSnippet.language}</span>
              </div>
              <div className="bg-stone-950 rounded-lg overflow-hidden border border-stone-800">
                <SyntaxHighlighter
                    language={module.codeSnippet.language === "python" ? "python" : "bash"}
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, padding: '1.25rem', background: 'transparent', fontSize: '0.85rem' }}
                    wrapLongLines={false}
                >
                    {module.codeSnippet.code}
                </SyntaxHighlighter>
              </div>
            </section>
          )}
          
          {module.vmSteps && (
              <section className="space-y-3">
                  <div className="flex items-center space-x-2 text-stone-400">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-semibold uppercase tracking-widest font-mono text-emerald-400">VM Replication Steps (Airgapped)</h3>
                  </div>
                  <div className="bg-stone-900 rounded-lg p-5 border border-stone-800 text-stone-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                      {module.vmSteps}
                  </div>
              </section>
          )}

          {module.quiz && module.quiz.length > 0 && (
              <section className="space-y-4">
                  <div className="flex items-center space-x-2 text-stone-400">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-semibold uppercase tracking-widest font-mono text-emerald-400">CEH Knowledge Check</h3>
                  </div>
                  <div className="space-y-4">
                      {module.quiz.map((q, i) => (
                          <div key={i} className="bg-stone-900 border border-stone-800 rounded-lg p-5">
                              <p className="text-stone-200 font-semibold mb-4 text-sm font-mono">Q{i + 1}: {q.question}</p>
                              <div className="space-y-2">
                                  {q.options.map((opt, j) => (
                                      <div key={j} className="flex items-start tracking-tight text-sm text-stone-400 hover:text-stone-200 cursor-pointer p-2 rounded hover:bg-stone-800/50 transition-colors">
                                          <div className="w-6 h-6 rounded-full border border-stone-700 flex items-center justify-center mr-3 flex-shrink-0 text-xs">
                                              {String.fromCharCode(65 + j)}
                                          </div>
                                          <span className="pt-0.5 leading-tight">{opt}</span>
                                      </div>
                                  ))}
                              </div>
                              <details className="mt-4 border-t border-stone-800 pt-3">
                                  <summary className="text-xs font-mono text-stone-500 cursor-pointer hover:text-emerald-400">View Answer & Explanation</summary>
                                  <div className="mt-3 text-sm text-stone-300 bg-black p-3 rounded border border-stone-800/50">
                                      <span className="font-bold text-emerald-400 block mb-1 font-mono">Answer: {q.answer}</span>
                                      {q.explanation}
                                  </div>
                              </details>
                          </div>
                      ))}
                  </div>
              </section>
          )}
          
        </div>

        {/* Sidebar Info Column */}
        <div className="space-y-6">
          
          <section className="space-y-3">
            <div className="flex items-center space-x-2 text-stone-400">
              <Map className="w-4 h-4" />
              <h3 className="text-sm font-semibold uppercase tracking-widest font-mono">CEH Map</h3>
            </div>
            <div className="bg-stone-900 rounded-lg p-4 border border-stone-800 text-sm text-stone-300">
              {module.cehMap}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center space-x-2 text-stone-400">
              <Terminal className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-semibold uppercase tracking-widest font-mono text-rose-400">Lab Target</h3>
            </div>
            <div className="bg-stone-900 rounded-lg p-4 border border-rose-900/30 text-sm text-stone-300">
              {module.labSetup}
              {(module.id === 'mitm-offense' || module.id === 'mitm-defense') && (
                <div className="mt-4 text-[11px] font-mono text-emerald-400 bg-emerald-950/50 p-2 border border-emerald-900/50 rounded inline-block w-full text-center tracking-widest">
                    TARGET IP: {module.labSetup.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/)?.[0] || '172.20.0.100'}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center space-x-2 text-stone-400">
              <ShieldAlert className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold uppercase tracking-widest font-mono text-blue-400">Defense</h3>
            </div>
            <div className="bg-stone-900 rounded-lg p-4 border border-blue-900/30 text-sm text-stone-300 space-y-2">
              {module.defense.split('. ').map((sentence, idx) => (
                <p key={idx}>{sentence}{(idx < module.defense.split('. ').length - 1) ? '.' : ''}</p>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center space-x-2 text-stone-400">
              <Flag className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold uppercase tracking-widest font-mono text-amber-400">Practice</h3>
            </div>
            <div className="bg-stone-900 rounded-lg p-4 border border-amber-900/30 text-sm text-stone-300">
              {module.practice}
            </div>
          </section>

          {module.glossary && module.glossary.length > 0 && (
              <section className="space-y-3">
                  <div className="flex items-center space-x-2 text-stone-400">
                      <BookOpen className="w-4 h-4 text-stone-400" />
                      <h3 className="text-sm font-semibold uppercase tracking-widest font-mono text-stone-400">Glossary</h3>
                  </div>
                  <div className="bg-stone-900 rounded-lg p-4 border border-stone-800 text-sm text-stone-300 space-y-3">
                      {module.glossary.map((g, i) => (
                          <div key={i} className="border-b border-stone-800/50 pb-2 last:border-0 last:pb-0">
                              <span className="text-stone-200 font-bold font-mono block mb-1 text-xs">{g.term}</span>
                              <span className="text-stone-400 text-xs leading-snug">{g.definition}</span>
                          </div>
                      ))}
                  </div>
              </section>
          )}

        </div>
      </div>
    </div>
  );
}
