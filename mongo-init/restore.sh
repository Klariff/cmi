#!/bin/bash
echo "[init] Restoring CMI database from backup..."
mongorestore --db=CMI /backup/CMI --authenticationDatabase admin -u admin -p cmi
echo "[init] Restore complete."
