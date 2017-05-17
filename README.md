# STATUS

[![Join the chat at https://gitter.im/hij1nx/lev](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/hij1nx/lev?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
BETA

# SYNOPSIS
A simple and convenient commandline tool and REPL for [`leveldb`](http://leveldb.org/).

# FEATURES
- REPL with colorized tab-completion and zsh/fish style key suggestions
- REPL automatically saves and reloads REPL history

# SCREENSHOT
![screenshot](/docs/screenshot.png)

# REPL COMMANDS
Use upper or lower case for the following commands.

## GET &lt;key&gt;
Get a key from the database.

## PUT &lt;key&gt; &lt;value&gt;
Put a value into the database. If you have `keyEncoding` or `valueEncoding`
set to `json`, these values will be parsed from strings into `json`.

## DEL &lt;key&gt;
Delete a key from the database.

## LS [sublevel]
Get all the keys or values in the current range.

Opts:

 - `[sublevel]` A sublevel filter, eg `ls users`
 - `-v/--values` Include values
 - `-s/--select <attr>` Filter attributes down to given attribute(s). Can be used more than once. Eg: `ls -s username -s email`
 - `-f/--filter <attr>=<value>` Filter entries down to given attribute=value match(es). Can be used more than once. Eg `ls -f username=bob -f email=bob@gmail.com`

## START &lt;key-pattern&gt;
Defines the start of the current range. You can also use `GT` or `GTE`.

## END &lt;key-pattern&gt;
Defines the end of the current range. You can also use `LT` or `LTE`.

## SUB &lt;name&gt;
Sugar to set START and END to the pattern for the given sub-level.

## SUBS
Tries to guess the full listing of sub-levels in the DB.

## LIMIT &lt;number&gt;
Limit the number of records in the current range (defaults to 5000).

## REVERSE
Reverse the records in the current range.

# CLI COMMANDS
These all match the parameters used with 
[`levelup`](https://github.com/rvagg/node-levelup). The default encoding
for the database is set to `json`.

## --start &lt;key-pattern&gt;
Specify the start of the current range. You can also use `gt` or `gte`.

## --end &lt;key-pattern&gt;
Specify the end of the current range. You can also use `lt` and `lte`.

## --values
Only list the all of the values in the current range. 
Emit as a new-line delimited stream of json.

## --keys
Only list all of the keys in the current range. Will tabularize the output.

## --keyEncoding &lt;string&gt;
Specify the encoding for the keys.

## --valueEncoding &lt;string&gt;
Specify the encoding for the values.

## --limit &lt;number&gt;
Limit the number of records emitted in the current range.

## --reverse
Reverse the stream.


