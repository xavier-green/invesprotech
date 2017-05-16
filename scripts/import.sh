#!/bin/bash

while [ ! $# -eq 0 ]
do
	case "$1" in
		--help | -h)
			echo ''
			echo ''
			echo "Utiliser : ./import.sh <options>"
			echo ''
			echo "-i pour importer les historiques"
			echo ''
			echo "-a pour importer les allocations"
			echo ''
			echo "-u pour update les flags des treated-transac"
			echo ''
			exit
			;;
		-i)
			echo 'Importing history from '$2
			sed 's/,/;/g' $2 > temp.csv
			mongoimport -d test -c strategies -f strat_id,protection,date,rendement,valeur_part --type csv --file temp.csv
			echo 'Done'
			;;
		-h)
			echo 'Importing allocations from '$2
			sed 's/,/;/g' $2 > temp.csv
			mongoimport -d test -c allocations --drop -f   "Milvus protection,Milvus strategy,Part,Actif,Continent,Region / Pays,Secteur /Type,Index" --type csv --file temp.csv
			echo 'Done'
			;;
		-u)
			echo 'Updating treated transactions from '$2
			cat $2 | while read line 
			do
			   echo $line
			   id=$(echo $line | cut -f 1 -d ';')
			   flag=$(echo $line | cut -f 2 -d ';')
			   query='db.treated_transactions.update({transaction_id:'$id'},{$set:{status:"'$flag'"}})'
			   mongo --eval $query
			done
			echo 'Done'
			;;
	esac
	shift
done

echo "All saved"