#!/bin/bash

while [ ! $# -eq 0 ]
do
	case "$1" in
		--help | -h)
			echo ''
			echo ''
			echo "Utiliser : ./export.sh <options>"
			echo ''
			echo "-u pour exporter les users depuis le dernier export, -u-all pour tous les exporter"
			echo ''
			echo "-p pour exporter les portfolios"
			echo ''
			echo "-pt pour exporter les pending_transactions"
			echo ''
			echo "-tt-all pour exporter toutes les treated_transactions"
			echo ''
			echo "-tt-date <date format: '2017-02-11'> pour exporter toutes les treated_transactions depuis une date"
			echo ''
			echo "Par exemple :    <./export.sh -u -p -t>   telecharge tout"
			echo ''
			echo ''
			exit
			;;
		-u)
			echo 'Downloading users since last export...'
			searchQuery='{}'
			if [ -f last_save.txt ]; then
			    lastId=$(head -1 last_save.txt)
				beginning='{_id:{$gt:'
				last='}}'
				searchQuery=$beginning$lastId$last
			fi
			echo 'Searching with query: '$searchQuery
			mongoexport --quiet -d test -c users -q $searchQuery -f _id,createdAt,email,phone,address,fiscal_type,protection_level,activated,profile.first_name,profile.last_name,profile.revenue,profile.epargne,legal.cote,legal.isf,legal.expose,legal.entourage_expose  --type csv --out users.csv
			if [[ $(wc -l <users.csv) -ge 2 ]]; then
				head -2 users.csv | tail -1 | cut -f 1 -d ',' > last_save.txt
			fi
			sed 's/,/;/g' users.csv > temp.csv && mv temp.csv users.csv
			echo 'Done'
			;;
		-u-all)
			echo 'Downloading all users...'
			mongoexport --quiet -d test -c users -f _id,createdAt,email,phone,address,fiscal_type,protection_level,activated,profile.first_name,profile.last_name,profile.revenue,profile.epargne,legal.cote,legal.isf,legal.expose,legal.entourage_expose  --type csv --out users.csv
			sed 's/,/;/g' users.csv > temp.csv && mv temp.csv users.csv
			echo 'Done'
			;;
		-p)
			echo 'Downloading all portfolios...'
			mongoexport --quiet -d test -c portfolios -f user_id,universe,protection_level,net_asset_value,deposit_amount,fiscal_type,deposit_frequency,fake,name --type csv --out portfolios.csv
			sed 's/,/;/g' portfolios.csv > temp.csv && mv temp.csv portfolios.csv
			echo 'Done'
			;;
		-pt)
			echo 'Downloading all pending transaction...'
			mongoexport --quiet -d test -c pending_transactions -f transaction_id,user_id,portfolio_id,quantity,deposit_type,universe.protection,universe.investment_universe,universe.type --type csv --out pending_transactions.csv
			sed 's/,/;/g' pending_transactions.csv > temp.csv && mv temp.csv pending_transactions.csv
			echo 'Done'
			;;
		-tt-all)
			echo 'Downloading all treated transaction...'
			mongoexport --quiet -d test -c treated_transactions -f transaction_id,user_id,portfolio_id,quantity,deposit_type,universe.protection,universe.investment_universe,universe.type,treated_date,status --type csv --out treated_transactions.csv
			sed 's/,/;/g' treated_transactions.csv > temp.csv && mv temp.csv treated_transactions.csv
			echo 'Done'
			;;
		-tt-sdate)
			echo 'Downloading all treated transaction from '$2
			searchQuery='{createdAt:{$gte:ISODate("'$2'T00:00:00.000Z")}}'
			mongoexport --quiet -d test -c treated_transactions -q $searchQuery  -f transaction_id,user_id,portfolio_id,quantity,deposit_type,universe.protection,universe.investment_universe,universe.type,treated_date,status --type csv --out treated_transactions.csv
			sed 's/,/;/g' treated_transactions.csv > temp.csv && mv temp.csv treated_transactions.csv
			echo 'Done'
			;;
		-tt-edate)
			echo 'Downloading all treated transaction before '$2
			searchQuery='{createdAt:{$lwe:ISODate("'$2'T00:00:00.000Z")}}'
			mongoexport --quiet -d test -c treated_transactions -q $searchQuery  -f transaction_id,user_id,portfolio_id,quantity,deposit_type,universe.protection,universe.investment_universe,universe.type,treated_date,status --type csv --out treated_transactions.csv
			sed 's/,/;/g' treated_transactions.csv > temp.csv && mv temp.csv treated_transactions.csv
			echo 'Done'
			;;
		-tt-sedate)
			echo 'Downloading all treated transaction from '$2' to '$3
			searchQuery='{createdAt:{$gte:ISODate("'$2'T00:00:00.000Z"),lwe:ISODate("'$3'T00:00:00.000Z")}}'
			mongoexport --quiet -d test -c treated_transactions -q $searchQuery  -f transaction_id,user_id,portfolio_id,quantity,deposit_type,universe.protection,universe.investment_universe,universe.type,treated_date,status --type csv --out treated_transactions.csv
			sed 's/,/;/g' treated_transactions.csv > temp.csv && mv temp.csv treated_transactions.csv
			echo 'Done'
			;;
	esac
	shift
done

echo "All saved"